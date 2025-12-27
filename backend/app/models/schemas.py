from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CityBase(BaseModel):
    city_name: str
    city_code: str
    city_type: str
    region: Optional[str] = None


class CityCreate(CityBase):
    pass


class City(CityBase):
    city_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class IndicatorBase(BaseModel):
    indicator_name: str
    indicator_code: str
    unit: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class IndicatorCreate(IndicatorBase):
    pass


class Indicator(IndicatorBase):
    indicator_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnnualDataBase(BaseModel):
    city_id: int
    indicator_id: int
    year: int
    value: Optional[float] = None
    data_quality: Optional[str] = "normal"
    data_source: Optional[str] = None


class AnnualDataCreate(AnnualDataBase):
    pass


class AnnualData(AnnualDataBase):
    data_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TimeSeriesData(BaseModel):
    city_id: int
    city_name: str
    indicator_id: int
    indicator_name: str
    data: List[Dict[str, Any]]


class CityComparison(BaseModel):
    cities: List[int]
    indicators: List[int]
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class ComparisonResult(BaseModel):
    city: str
    indicator: str
    values: Dict[int, float]


class CorrelationRequest(BaseModel):
    city_ids: List[int]
    indicator_ids: List[int]
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class CorrelationResult(BaseModel):
    indicator_1: str
    indicator_2: str
    correlation: float
    p_value: Optional[float] = None


class TrendAnalysisRequest(BaseModel):
    city_id: int
    indicator_id: int
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class TrendAnalysisResult(BaseModel):
    city: str
    indicator: str
    slope: float
    intercept: float
    r_squared: float
    growth_rate: Optional[float] = None


class PredictionRequest(BaseModel):
    city_id: int
    indicator_id: int
    model_type: str = "linear"
    prediction_years: int = 3
    confidence_level: float = 0.95


class PredictionResult(BaseModel):
    city: str
    indicator: str
    model_type: str
    predictions: List[Dict[str, Any]]
    accuracy: Dict[str, float]


class ReportRequest(BaseModel):
    report_type: str
    city_ids: List[int]
    indicator_ids: List[int]
    include_charts: bool = True
    auto_summary: bool = True


class ReportResponse(BaseModel):
    report_id: str
    report_url: str
    created_at: datetime
