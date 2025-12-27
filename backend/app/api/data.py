from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.schemas import (
    City, CityCreate, Indicator, IndicatorCreate,
    AnnualData, AnnualDataCreate, TimeSeriesData,
    CityComparison, CorrelationRequest, CorrelationResult,
    TrendAnalysisRequest, TrendAnalysisResult
)
from app.services.data_service import DataService
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.get("/cities", response_model=List[City])
def get_cities(db: Session = Depends(get_db)):
    return DataService.get_all_cities(db)


@router.get("/cities/{city_id}", response_model=City)
def get_city(city_id: int, db: Session = Depends(get_db)):
    city = DataService.get_city_by_id(db, city_id)
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")
    return city


@router.post("/cities", response_model=City)
def create_city(city: CityCreate, db: Session = Depends(get_db)):
    return DataService.create_city(db, city)


@router.get("/indicators", response_model=List[Indicator])
def get_indicators(db: Session = Depends(get_db)):
    return DataService.get_all_indicators(db)


@router.get("/indicators/{indicator_id}", response_model=Indicator)
def get_indicator(indicator_id: int, db: Session = Depends(get_db)):
    indicator = DataService.get_indicator_by_id(db, indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="指标不存在")
    return indicator


@router.post("/indicators", response_model=Indicator)
def create_indicator(indicator: IndicatorCreate, db: Session = Depends(get_db)):
    return DataService.create_indicator(db, indicator)


@router.get("/timeseries")
def get_timeseries_data(
    city_id: int,
    indicator_id: int,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return DataService.get_timeseries_data(db, city_id, indicator_id, start_year, end_year)


@router.get("/annual-data")
def get_annual_data(
    city_id: Optional[int] = None,
    indicator_id: Optional[int] = None,
    year: Optional[int] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    data = DataService.get_annual_data(
        db, city_id, indicator_id, year, start_year, end_year
    )
    return [
        {
            "data_id": d.data_id,
            "city_id": d.city_id,
            "indicator_id": d.indicator_id,
            "year": d.year,
            "value": float(d.value) if d.value else None,
            "data_quality": d.data_quality
        }
        for d in data
    ]


@router.post("/annual-data", response_model=AnnualData)
def create_annual_data(data: AnnualDataCreate, db: Session = Depends(get_db)):
    return DataService.create_annual_data(db, data)


@router.get("/regional-summary/{year}")
def get_regional_summary(year: int, db: Session = Depends(get_db)):
    return DataService.get_regional_summary(db, year)


@router.get("/ranking")
def get_city_ranking(
    indicator_id: int,
    year: int,
    db: Session = Depends(get_db)
):
    return DataService.get_city_ranking(db, indicator_id, year)


@router.post("/compare")
def compare_cities(comparison: CityComparison, db: Session = Depends(get_db)):
    return AnalysisService.compare_cities(
        db,
        comparison.cities,
        comparison.indicators,
        comparison.start_year,
        comparison.end_year
    )


@router.post("/correlation")
def calculate_correlation(request: CorrelationRequest, db: Session = Depends(get_db)):
    return AnalysisService.calculate_correlation(
        db,
        request.city_ids,
        request.indicator_ids,
        request.start_year,
        request.end_year
    )


@router.post("/trend-analysis")
def analyze_trend(request: TrendAnalysisRequest, db: Session = Depends(get_db)):
    return AnalysisService.analyze_trend(
        db,
        request.city_id,
        request.indicator_id,
        request.start_year,
        request.end_year
    )


@router.get("/growth-rate/{city_id}/{indicator_id}/{year}")
def get_growth_rate(city_id: int, indicator_id: int, year: int, db: Session = Depends(get_db)):
    return AnalysisService.calculate_growth_rate(db, city_id, indicator_id, year)


@router.get("/ranking-history")
def get_ranking_history(
    indicator_id: int,
    start_year: int,
    end_year: int,
    db: Session = Depends(get_db)
):
    return AnalysisService.get_ranking_history(db, indicator_id, start_year, end_year)
