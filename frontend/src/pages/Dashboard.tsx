import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Select, Spin, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dataApi } from '../services/api';
import type { City, Indicator, RegionalSummary, CityRanking } from '../types';

const { Option } = Select;

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [cities, setCities] = useState<City[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [regionalSummary, setRegionalSummary] = useState<RegionalSummary | null>(null);
  const [gdpRanking, setGdpRanking] = useState<CityRanking[]>([]);
  const [populationData, setPopulationData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [citiesData, indicatorsData] = await Promise.all([
        dataApi.getCities(),
        dataApi.getIndicators(),
      ]);
      setCities(citiesData);
      setIndicators(indicatorsData);

      const gdpIndicator = indicatorsData.find(i => i.indicator_code === 'gdp');
      const populationIndicator = indicatorsData.find(i => i.indicator_code === 'population');

      if (gdpIndicator) {
        const [summary, ranking] = await Promise.all([
          dataApi.getRegionalSummary(selectedYear),
          dataApi.getCityRanking(gdpIndicator.indicator_id, selectedYear),
        ]);
        setRegionalSummary(summary);
        setGdpRanking(ranking);
      }

      if (populationIndicator) {
        const populationTimeSeries = await Promise.all(
          citiesData.map(city =>
            dataApi.getTimeSeries(city.city_id, populationIndicator.indicator_id, 2019, selectedYear)
          )
        );
        
        const chartData = {
          years: populationTimeSeries[0]?.data.map(d => d.year) || [],
          series: citiesData.map((city, index) => ({
            name: city.city_name,
            data: populationTimeSeries[index]?.data.map(d => d.value) || [],
          })),
        };
        setPopulationData(chartData);
      }
    } catch (error) {
      messageApi.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGdpChartOption = () => {
    return {
      title: {
        text: `城市GDP排名 (${selectedYear})`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'category',
        data: gdpRanking.map(r => r.city_name),
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'value',
        name: 'GDP (亿元)',
      },
      series: [
        {
          name: 'GDP',
          type: 'bar',
          data: gdpRanking.map(r => r.value),
          itemStyle: {
            color: (params: any) => {
              const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F8B500', '#FF6F91', '#845EC2', '#FF9671', '#FFC75F'];
              return colors[params.dataIndex % colors.length];
            },
          },
        },
      ],
    };
  };

  const getPopulationChartOption = () => {
    if (!populationData) return {};

    return {
      title: {
        text: '城市人口变化趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: populationData.series.map(s => s.name),
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        data: populationData.years,
      },
      yAxis: {
        type: 'value',
        name: '人口 (万人)',
      },
      series: populationData.series.map(s => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
      })),
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>{contextHolder}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>区域总览</h2>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: 120 }}
        >
          {Array.from({ length: 26 }, (_, i) => 1999 + i).map(year => (
            <Option key={year} value={year}>
              {year}年
            </Option>
          ))}
        </Select>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="GDP总量"
              value={regionalSummary?.total_gdp || 0}
              precision={2}
              suffix="亿元"
              valueStyle={{ color: '#1890FF' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总人口"
              value={regionalSummary?.total_population || 0}
              precision={0}
              suffix="万人"
              valueStyle={{ color: '#52C41A' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="进出口总额"
              value={regionalSummary?.total_trade || 0}
              precision={2}
              suffix="亿美元"
              valueStyle={{ color: '#FAAD14' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="城市GDP排名" variant="outlined">
            <ReactECharts option={getGdpChartOption()} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="人口增长趋势" variant="outlined">
            <ReactECharts option={getPopulationChartOption()} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
