export interface City {
  city_id: number;
  city_name: string;
  city_code: string;
  city_type: string;
  region: string;
  created_at: string;
}

export interface Indicator {
  indicator_id: number;
  indicator_name: string;
  indicator_code: string;
  unit: string;
  category: string;
  description: string;
  created_at: string;
}

export interface AnnualData {
  data_id: number;
  city_id: number;
  indicator_id: number;
  year: number;
  value: number | null;
  data_quality: string;
  data_source: string;
  created_at: string;
}

export interface TimeSeriesData {
  city_id: number;
  city_name: string;
  indicator_id: number;
  indicator_name: string;
  unit: string;
  data: Array<{ year: number; value: number | null }>;
}

export interface ComparisonData {
  indicator_id: number;
  indicator_name: string;
  unit: string;
  cities: Array<{
    city_id: number;
    city_name: string;
    values: Record<number, number | null>;
    avg_value?: number;
    min_value?: number;
    max_value?: number;
    latest_value?: number;
    growth_rate?: number;
  }>;
}

export interface CorrelationData {
  indicator_1: string;
  indicator_2: string;
  correlation: number;
  p_value: number;
  strength: string;
}

export interface TrendAnalysisData {
  city: string;
  indicator: string;
  unit: string;
  slope: number;
  intercept: number;
  r_squared: number;
  growth_rate: number | null;
  trend: string;
  data_points: number;
}

export interface PredictionData {
  city: string;
  indicator: string;
  unit: string;
  model_type: string;
  predictions: Array<{
    year: number;
    predicted_value: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
  accuracy: {
    r_squared?: number;
    mse?: number;
    mae?: number;
    aic?: number;
    bic?: number;
  };
  training_years: number[];
  training_values: number[];
}

export interface RegionalSummary {
  total_gdp: number;
  total_population: number;
  total_trade: number;
}

export interface CityRanking {
  rank: number;
  city_id: number;
  city_name: string;
  value: number;
}
