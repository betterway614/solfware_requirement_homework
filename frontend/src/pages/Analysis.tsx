import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Button, Spin, Tabs, Table, message, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import { dataApi } from '../services/api';
import type { City, Indicator, ComparisonData, CorrelationData } from '../types';

const { Option } = Select;

const Analysis: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedCities, setSelectedCities] = useState<number[]>([1, 2]);
  const [selectedIndicators, setSelectedIndicators] = useState<number[]>([1]);
  const [startYear, setStartYear] = useState(2019);
  const [endYear, setEndYear] = useState(2024);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [activeTab, setActiveTab] = useState('compare');

  useEffect(() => {
    fetchBasicData();
  }, []);

  const fetchBasicData = async () => {
    try {
      const [citiesData, indicatorsData] = await Promise.all([
        dataApi.getCities(),
        dataApi.getIndicators(),
      ]);
      setCities(citiesData);
      setIndicators(indicatorsData);
    } catch (error) {
      messageApi.error('加载基础数据失败');
    }
  };

  const handleCompare = async () => {
    if (selectedCities.length < 2) {
      messageApi.warning('请至少选择2个城市');
      return;
    }
    if (selectedIndicators.length === 0) {
      messageApi.warning('请至少选择1个指标');
      return;
    }

    try {
      setLoading(true);
      const data = await dataApi.compareCities(
        selectedCities,
        selectedIndicators,
        startYear,
        endYear
      );
      setComparisonData(data);
      setActiveTab('compare');
    } catch (error) {
      messageApi.error('对比分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrelation = async () => {
    if (selectedCities.length === 0) {
      messageApi.warning('请至少选择1个城市');
      return;
    }
    if (selectedIndicators.length < 2) {
      messageApi.warning('请至少选择2个指标');
      return;
    }

    try {
      setLoading(true);
      const data = await dataApi.calculateCorrelation(
        selectedCities,
        selectedIndicators,
        startYear,
        endYear
      );
      setCorrelationData(data);
      setActiveTab('correlation');
    } catch (error) {
      messageApi.error('相关性分析失败');
    } finally {
      setLoading(false);
    }
  };

  const getBarChartOption = (data: ComparisonData) => {
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    
    return {
      title: {
        text: data.indicator_name,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: data.cities.map(c => c.city_name),
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: years,
      },
      yAxis: {
        type: 'value',
        name: data.unit,
      },
      series: data.cities.map(city => ({
        name: city.city_name,
        type: 'bar',
        data: years.map(year => city.values[year] || 0),
      })),
    };
  };

  const getCorrelationTableColumns = () => [
    {
      title: '指标1',
      dataIndex: 'indicator_1',
      key: 'indicator_1',
    },
    {
      title: '指标2',
      dataIndex: 'indicator_2',
      key: 'indicator_2',
    },
    {
      title: '相关系数',
      dataIndex: 'correlation',
      key: 'correlation',
      render: (value: number) => value.toFixed(4),
    },
    {
      title: 'P值',
      dataIndex: 'p_value',
      key: 'p_value',
      render: (value: number) => value.toFixed(4),
    },
    {
      title: '相关性强度',
      dataIndex: 'strength',
      key: 'strength',
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          '强相关': '#52C41A',
          '中等相关': '#FAAD14',
          '弱相关': '#1890FF',
          '极弱相关': '#8C8C8C',
        };
        return <span style={{ color: colorMap[value] }}>{value}</span>;
      },
    },
  ];

  const getCorrelationHeatmapOption = (data: CorrelationData[]) => {
    // 提取所有唯一指标
    const indicators = Array.from(new Set(
      data.flatMap(item => [item.indicator_1, item.indicator_2])
    ));
    
    // 创建指标索引映射
    const indicatorIndex: Record<string, number> = {};
    indicators.forEach((indicator, index) => {
      indicatorIndex[indicator] = index;
    });
    
    // 初始化相关性矩阵
    const matrix: number[][] = Array.from({ length: indicators.length }, () => 
      Array.from({ length: indicators.length }, () => 0)
    );
    
    // 填充相关性矩阵
    data.forEach(item => {
      const i = indicatorIndex[item.indicator_1];
      const j = indicatorIndex[item.indicator_2];
      matrix[i][j] = item.correlation;
      matrix[j][i] = item.correlation; // 对称矩阵
    });
    
    // 生成热力图数据
    const heatmapData: [number, number, number][] = [];
    for (let i = 0; i < indicators.length; i++) {
      for (let j = 0; j < indicators.length; j++) {
        heatmapData.push([i, j, matrix[i][j]]);
      }
    }
    
    return {
      title: {
        text: '指标相关性热力图',
        left: 'center',
      },
      tooltip: {
        position: 'top',
        formatter: function(params: any) {
          const indicator1 = indicators[params.data[0]];
          const indicator2 = indicators[params.data[1]];
          const correlation = params.data[2].toFixed(4);
          return `${indicator1}<br/>${indicator2}<br/>相关系数: ${correlation}`;
        },
      },
      grid: {
        height: '50%',
        top: '10%',
      },
      xAxis: {
        type: 'category',
        data: indicators,
        splitArea: {
          show: true,
        },
        axisLabel: {
          interval: 0,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'category',
        data: indicators,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
        },
        textStyle: {
          color: '#333',
        },
      },
      series: [
        {
          name: '相关系数',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            formatter: function(params: any) {
              return params.data[2].toFixed(2);
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  const getComparisonTableColumns = (data: ComparisonData) => {
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    
    return [
      {
        title: '城市',
        dataIndex: 'city_name',
        key: 'city_name',
        fixed: 'left' as const,
        width: 100,
      },
      ...years.map(year => ({
        title: `${year}年`,
        dataIndex: year,
        key: year,
        render: (_: any, record: any) => {
          const city = data.cities.find(c => c.city_id === record.city_id);
          return city?.values[year]?.toFixed(2) || '-';
        },
      })),
      {
        title: '平均值',
        dataIndex: 'avg_value',
        key: 'avg_value',
        render: (value: number) => value?.toFixed(2) || '-',
      },
      {
        title: '增长率',
        dataIndex: 'growth_rate',
        key: 'growth_rate',
        render: (value: number) => {
          if (value === undefined) return '-';
          const color = value > 0 ? '#52C41A' : value < 0 ? '#FF4D4F' : '#8C8C8C';
          return <span style={{ color }}>{value.toFixed(2)}%</span>;
        },
      },
    ];
  };

  const tabItems = [
    {
      key: 'compare',
      label: '城市对比',
      children: comparisonData.map((data, index) => (
        <Card
          key={index}
          title={data.indicator_name}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ReactECharts option={getBarChartOption(data)} style={{ height: 400 }} />
            </Col>
            <Col xs={24} lg={12}>
              <Table
                columns={getComparisonTableColumns(data)}
                dataSource={data.cities.map(c => ({ ...c, key: c.city_id }))}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Col>
          </Row>
        </Card>
      )),
    },
    {
      key: 'correlation',
      label: '指标关联',
      children: (
        <Card title="指标相关性分析">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <ReactECharts 
                option={getCorrelationHeatmapOption(correlationData)} 
                style={{ height: 600 }}
              />
            </Col>
            <Col xs={24}>
              <h3 style={{ marginTop: 24, marginBottom: 16 }}>相关性详细数据</h3>
              <Table
                columns={getCorrelationTableColumns()}
                dataSource={correlationData.map((d, i) => ({ ...d, key: i }))}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div>{contextHolder}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>选择城市 (2-11个)</div>
            <Select
              mode="multiple"
              value={selectedCities}
              onChange={setSelectedCities}
              style={{ width: '100%' }}
              placeholder="请选择城市"
              maxTagCount="responsive"
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
              mode="multiple"
              value={selectedIndicators}
              onChange={setSelectedIndicators}
              style={{ width: '100%' }}
              placeholder="请选择指标"
              maxTagCount="responsive"
            >
              {indicators.map(indicator => (
                <Option key={indicator.indicator_id} value={indicator.indicator_id}>
                  {indicator.indicator_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div style={{ marginBottom: 8 }}>起始年份</div>
            <Select
              value={startYear}
              onChange={setStartYear}
              style={{ width: '100%' }}
            >
              {Array.from({ length: 26 }, (_, i) => 1999 + i).map(year => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div style={{ marginBottom: 8 }}>结束年份</div>
            <Select
              value={endYear}
              onChange={setEndYear}
              style={{ width: '100%' }}
            >
              {Array.from({ length: 26 }, (_, i) => 1999 + i).map(year => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ marginBottom: 8 }}>&nbsp;</div>
            <Space>
              <Button type="primary" onClick={handleCompare} loading={loading}>
                城市对比
              </Button>
              <Button onClick={handleCorrelation} loading={loading}>
                指标关联
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
      </Spin>
    </div>
  );
};

export default Analysis;
