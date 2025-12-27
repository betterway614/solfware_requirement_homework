import axios from 'axios';
import type {
  City,
  Indicator,
  TimeSeriesData,
  ComparisonData,
  CorrelationData,
  TrendAnalysisData,
  PredictionData,
  RegionalSummary,
  CityRanking,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

export const dataApi = {
  getCities: async (): Promise<City[]> => {
    const response = await api.get<City[]>('/data/cities');
    return response.data;
  },

  getCity: async (cityId: number): Promise<City> => {
    const response = await api.get<City>(`/data/cities/${cityId}`);
    return response.data;
  },

  getIndicators: async (): Promise<Indicator[]> => {
    const response = await api.get<Indicator[]>('/data/indicators');
    return response.data;
  },

  getIndicator: async (indicatorId: number): Promise<Indicator> => {
    const response = await api.get<Indicator>(`/data/indicators/${indicatorId}`);
    return response.data;
  },

  getTimeSeries: async (
    cityId: number,
    indicatorId: number,
    startYear?: number,
    endYear?: number
  ): Promise<TimeSeriesData> => {
    const params: any = { city_id: cityId, indicator_id: indicatorId };
    if (startYear) params.start_year = startYear;
    if (endYear) params.end_year = endYear;
    const response = await api.get<TimeSeriesData>('/data/timeseries', { params });
    return response.data;
  },

  getAnnualData: async (params?: any) => {
    const response = await api.get('/data/annual-data', { params });
    return response.data;
  },

  getRegionalSummary: async (year: number): Promise<RegionalSummary> => {
    const response = await api.get<RegionalSummary>(`/data/regional-summary/${year}`);
    return response.data;
  },

  getCityRanking: async (indicatorId: number, year: number): Promise<CityRanking[]> => {
    const response = await api.get<CityRanking[]>('/data/ranking', {
      params: { indicator_id: indicatorId, year },
    });
    return response.data;
  },

  compareCities: async (
    cities: number[],
    indicators: number[],
    startYear?: number,
    endYear?: number
  ): Promise<ComparisonData[]> => {
    const response = await api.post<ComparisonData[]>('/data/compare', {
      cities,
      indicators,
      start_year: startYear,
      end_year: endYear,
    });
    return response.data;
  },

  calculateCorrelation: async (
    cityIds: number[],
    indicatorIds: number[],
    startYear?: number,
    endYear?: number
  ): Promise<CorrelationData[]> => {
    const response = await api.post<CorrelationData[]>('/data/correlation', {
      city_ids: cityIds,
      indicator_ids: indicatorIds,
      start_year: startYear,
      end_year: endYear,
    });
    return response.data;
  },

  analyzeTrend: async (
    cityId: number,
    indicatorId: number,
    startYear?: number,
    endYear?: number
  ): Promise<TrendAnalysisData> => {
    const response = await api.post<TrendAnalysisData>('/data/trend-analysis', {
      city_id: cityId,
      indicator_id: indicatorId,
      start_year: startYear,
      end_year: endYear,
    });
    return response.data;
  },

  getGrowthRate: async (cityId: number, indicatorId: number, year: number) => {
    const response = await api.get(`/data/growth-rate/${cityId}/${indicatorId}/${year}`);
    return response.data;
  },

  getRankingHistory: async (
    indicatorId: number,
    startYear: number,
    endYear: number
  ) => {
    const response = await api.get('/data/ranking-history', {
      params: { indicator_id: indicatorId, start_year: startYear, end_year: endYear },
    });
    return response.data;
  },
};

export const predictionApi = {
  predictLinear: async (
    cityId: number,
    indicatorId: number,
    predictionYears: number = 3,
    confidenceLevel: number = 0.95
  ): Promise<PredictionData> => {
    const response = await api.post<PredictionData>('/prediction/predict/linear', {
      city_id: cityId,
      indicator_id: indicatorId,
      prediction_years: predictionYears,
      confidence_level: confidenceLevel,
    });
    return response.data;
  },

  predictArima: async (
    cityId: number,
    indicatorId: number,
    predictionYears: number = 3
  ): Promise<PredictionData> => {
    const response = await api.post<PredictionData>('/prediction/predict/arima', {
      city_id: cityId,
      indicator_id: indicatorId,
      prediction_years: predictionYears,
    });
    return response.data;
  },

  predictEnsemble: async (
    cityId: number,
    indicatorId: number,
    predictionYears: number = 3,
    confidenceLevel: number = 0.95
  ): Promise<PredictionData> => {
    const response = await api.post<PredictionData>('/prediction/predict/ensemble', {
      city_id: cityId,
      indicator_id: indicatorId,
      prediction_years: predictionYears,
      confidence_level: confidenceLevel,
    });
    return response.data;
  },

  predictSimulation: async (
    cityId: number,
    indicatorId: number,
    scenarioParams: Record<string, number>,
    predictionYears: number = 3
  ) => {
    const response = await api.post('/prediction/predict/simulation', null, {
      params: {
        city_id: cityId,
        indicator_id: indicatorId,
        prediction_years: predictionYears,
      },
      data: scenarioParams,
    });
    return response.data;
  },
};

export default api;
