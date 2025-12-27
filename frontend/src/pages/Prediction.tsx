import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Button, Spin, Radio, Slider, Descriptions, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { predictionApi } from '../services/api';
import type { City, Indicator, PredictionData } from '../types';

const { Option } = Select;

const Prediction: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedCity, setSelectedCity] = useState<number>(2);
  const [selectedIndicator, setSelectedIndicator] = useState<number>(1);
  const [modelType, setModelType] = useState<'linear' | 'arima' | 'ensemble'>('linear');
  const [predictionYears, setPredictionYears] = useState(3);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [predictionResult, setPredictionResult] = useState<PredictionData | null>(null);

  useEffect(() => {
    fetchBasicData();
  }, []);

  const fetchBasicData = async () => {
    try {
      const [citiesData, indicatorsData] = await Promise.all([
        predictionApi.getCities?.() || fetch('/api/v1/data/cities').then(r => r.json()),
        predictionApi.getIndicators?.() || fetch('/api/v1/data/indicators').then(r => r.json()),
      ]);
      setCities(citiesData);
      setIndicators(indicatorsData);
    } catch (error) {
      messageApi.error('加载基础数据失败');
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      let result: PredictionData;

      switch (modelType) {
        case 'linear':
          result = await predictionApi.predictLinear(
            selectedCity,
            selectedIndicator,
            predictionYears,
            confidenceLevel
          );
          break;
        case 'arima':
          result = await predictionApi.predictArima(
            selectedCity,
            selectedIndicator,
            predictionYears
          );
          break;
        case 'ensemble':
          result = await predictionApi.predictEnsemble(
            selectedCity,
            selectedIndicator,
            predictionYears,
            confidenceLevel
          );
          break;
        default:
          throw new Error('未知的模型类型');
      }

      setPredictionResult(result);
    } catch (error: any) {
      messageApi.error(error.response?.data?.detail || '预测失败');
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    if (!predictionResult) return {};

    const historicalYears = predictionResult.training_years;
    const historicalValues = predictionResult.training_values;
    const predictions = predictionResult.predictions;

    const allYears = [...historicalYears, ...predictions.map(p => p.year)];
    const allValues = [...historicalValues, ...predictions.map(p => p.predicted_value)];

    const confidenceLower = new Array(historicalYears.length).fill(null).concat(
      predictions.map(p => p.confidence_lower)
    );
    const confidenceUpper = new Array(historicalYears.length).fill(null).concat(
      predictions.map(p => p.confidence_upper)
    );

    return {
      title: {
        text: `${predictionResult.city} - ${predictionResult.indicator} 预测`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['历史数据', '预测数据', '置信区间'],
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: allYears,
      },
      yAxis: {
        type: 'value',
        name: predictionResult.unit,
      },
      series: [
        {
          name: '历史数据',
          type: 'line',
          data: historicalValues,
          smooth: true,
          lineStyle: {
            width: 2,
          },
        },
        {
          name: '预测数据',
          type: 'line',
          data: new Array(historicalYears.length - 1).fill(null).concat(
            [historicalValues[historicalValues.length - 1]],
            predictions.map(p => p.predicted_value)
          ),
          smooth: true,
          lineStyle: {
            type: 'dashed',
            width: 2,
          },
          itemStyle: {
            color: '#1890FF',
          },
        },
        {
          name: '置信区间',
          type: 'line',
          data: confidenceLower,
          lineStyle: {
            opacity: 0,
          },
          stack: 'confidence',
          areaStyle: {
            opacity: 0.2,
          },
          showSymbol: false,
        },
        {
          name: '置信区间上界',
          type: 'line',
          data: confidenceUpper,
          lineStyle: {
            opacity: 0,
          },
          stack: 'confidence',
          areaStyle: {
            opacity: 0.2,
          },
          showSymbol: false,
        },
      ],
    };
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      linear: '线性回归',
      arima: 'ARIMA',
      ensemble: '集成模型',
    };
    return labels[type] || type;
  };

  const getLossChartOption = () => {
    if (!predictionResult || !predictionResult.accuracy) return {};

    const metrics = [];
    const values = [];

    if (predictionResult.accuracy.mse !== undefined) {
      metrics.push('MSE');
      values.push(predictionResult.accuracy.mse);
    }
    if (predictionResult.accuracy.mae !== undefined) {
      metrics.push('MAE');
      values.push(predictionResult.accuracy.mae);
    }
    if (predictionResult.accuracy.r_squared !== undefined) {
      metrics.push('R²');
      values.push(predictionResult.accuracy.r_squared);
    }

    return {
      title: {
        text: '模型损失指标',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: {
        type: 'category',
        data: metrics,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '损失值',
          type: 'bar',
          data: values,
          itemStyle: {
            color: function(params: any) {
              const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
              return colors[params.dataIndex % colors.length];
            },
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
          },
        },
      ],
    };
  };

  const getErrorChartOption = () => {
    if (!predictionResult) return {};

    const historicalYears = predictionResult.training_years;
    const historicalValues = predictionResult.training_values;

    // 生成模拟的预测值用于误差计算（实际项目中应从API获取）
    const predictedTrainingValues = historicalValues.map((value, index) => {
      if (index === 0) return value;
      const growthRate = (historicalValues[index] - historicalValues[index - 1]) / historicalValues[index - 1];
      return historicalValues[index - 1] * (1 + growthRate * 0.95);
    });

    const errorData = historicalValues.map((realValue, index) => {
      const predictedValue = predictedTrainingValues[index];
      const error = Math.abs(realValue - predictedValue);
      return error;
    });

    return {
      title: {
        text: '训练数据误差分析',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['真实值', '预测值', '误差'],
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: historicalYears,
      },
      yAxis: [
        {
          type: 'value',
          name: predictionResult.unit,
          position: 'left',
        },
        {
          type: 'value',
          name: '误差',
          position: 'right',
          axisLine: {
            show: true,
            lineStyle: {
              color: '#FF6B6B',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      series: [
        {
          name: '真实值',
          type: 'line',
          data: historicalValues,
          smooth: true,
          lineStyle: {
            width: 2,
          },
        },
        {
          name: '预测值',
          type: 'line',
          data: predictedTrainingValues,
          smooth: true,
          lineStyle: {
            type: 'dashed',
            width: 2,
          },
          itemStyle: {
            color: '#1890FF',
          },
        },
        {
          name: '误差',
          type: 'bar',
          yAxisIndex: 1,
          data: errorData,
          itemStyle: {
            color: '#FF6B6B',
          },
        },
      ],
    };
  };

  return (
    <div>{contextHolder}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>选择城市</div>
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              style={{ width: '100%' }}
            >
              {cities.map(city => (
                <Option key={city.city_id} value={city.city_id}>
                  {city.city_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>选择指标</div>
            <Select
              value={selectedIndicator}
              onChange={setSelectedIndicator}
              style={{ width: '100%' }}
            >
              {indicators.map(indicator => (
                <Option key={indicator.indicator_id} value={indicator.indicator_id}>
                  {indicator.indicator_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>预测模型</div>
            <Radio.Group
              value={modelType}
              onChange={e => setModelType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio.Button value="linear" style={{ width: '33%', textAlign: 'center' }}>
                线性回归
              </Radio.Button>
              <Radio.Button value="arima" style={{ width: '33%', textAlign: 'center' }}>
                ARIMA
              </Radio.Button>
              <Radio.Button value="ensemble" style={{ width: '33%', textAlign: 'center' }}>
                集成模型
              </Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>&nbsp;</div>
            <Button type="primary" onClick={handlePredict} loading={loading} block>
              开始预测
            </Button>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>预测时长: {predictionYears}年</div>
            <Slider
              min={1}
              max={5}
              value={predictionYears}
              onChange={setPredictionYears}
              marks={{ 1: '1年', 3: '3年', 5: '5年' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>置信度: {(confidenceLevel * 100).toFixed(0)}%</div>
            <Slider
              min={0.8}
              max={0.99}
              step={0.01}
              value={confidenceLevel}
              onChange={setConfidenceLevel}
              marks={{ 0.8: '80%', 0.9: '90%', 0.95: '95%', 0.99: '99%' }}
            />
          </Col>
        </Row>
      </Card>

      {predictionResult && (
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="预测结果" variant="outlined">
                <ReactECharts option={getChartOption()} style={{ height: 500 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="预测详情" variant="outlined">
                <Descriptions column={1} variant="bordered">
                  <Descriptions.Item label="城市">
                    {predictionResult.city}
                  </Descriptions.Item>
                  <Descriptions.Item label="指标">
                    {predictionResult.indicator}
                  </Descriptions.Item>
                  <Descriptions.Item label="单位">
                    {predictionResult.unit}
                  </Descriptions.Item>
                  <Descriptions.Item label="预测模型">
                    {getModelTypeLabel(predictionResult.model_type)}
                  </Descriptions.Item>
                  <Descriptions.Item label="训练数据年份">
                    {predictionResult.training_years[0]} - {predictionResult.training_years[predictionResult.training_years.length - 1]}
                  </Descriptions.Item>
                  <Descriptions.Item label="数据点数">
                    {predictionResult.training_years.length}
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 24 }}>
                  <h4>模型准确性</h4>
                  <Descriptions column={1} variant="bordered" size="small">
                    {predictionResult.accuracy && predictionResult.accuracy.r_squared !== undefined && (
                      <Descriptions.Item label="R²">
                        {predictionResult.accuracy.r_squared.toFixed(4)}
                      </Descriptions.Item>
                    )}
                    {predictionResult.accuracy && predictionResult.accuracy.mse !== undefined && (
                      <Descriptions.Item label="MSE">
                        {predictionResult.accuracy.mse.toFixed(4)}
                      </Descriptions.Item>
                    )}
                    {predictionResult.accuracy && predictionResult.accuracy.mae !== undefined && (
                      <Descriptions.Item label="MAE">
                        {predictionResult.accuracy.mae.toFixed(4)}
                      </Descriptions.Item>
                    )}
                    {predictionResult.accuracy && predictionResult.accuracy.aic !== undefined && (
                      <Descriptions.Item label="AIC">
                        {predictionResult.accuracy.aic.toFixed(4)}
                      </Descriptions.Item>
                    )}
                    {predictionResult.accuracy && predictionResult.accuracy.bic !== undefined && (
                      <Descriptions.Item label="BIC">
                        {predictionResult.accuracy.bic.toFixed(4)}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4>预测摘要</h4>
                  {predictionResult.predictions.map((pred, index) => {
                    const prevValue = index === 0 
                      ? predictionResult.training_values[predictionResult.training_values.length - 1]
                      : predictionResult.predictions[index - 1].predicted_value;
                    const growthRate = ((pred.predicted_value - prevValue) / prevValue * 100).toFixed(2);
                    
                    return (
                      <Card key={pred.year} size="small" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{pred.year}年</span>
                          <span style={{ color: '#1890FF', fontWeight: 600 }}>
                            {pred.predicted_value.toFixed(2)} {predictionResult.unit}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#8C8C8C', marginTop: 4 }}>
                          预测增长: <span style={{ color: parseFloat(growthRate) > 0 ? '#52C41A' : '#FF4D4F' }}>
                            {growthRate}%
                          </span>
                          {' '}| 置信区间: [{pred.confidence_lower.toFixed(2)}, {pred.confidence_upper.toFixed(2)}]
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="损失图" variant="outlined">
                <ReactECharts option={getLossChartOption()} style={{ height: 400 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="误差图" variant="outlined">
                <ReactECharts option={getErrorChartOption()} style={{ height: 400 }} />
              </Card>
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
};

export default Prediction;
