from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from app.models.database import City, Indicator, AnnualData
from app.models.schemas import CityCreate, IndicatorCreate, AnnualDataCreate
import pandas as pd


class DataService:
    
    @staticmethod
    def get_all_cities(db: Session) -> List[City]:
        return db.query(City).all()
    
    @staticmethod
    def get_city_by_id(db: Session, city_id: int) -> Optional[City]:
        return db.query(City).filter(City.city_id == city_id).first()
    
    @staticmethod
    def get_city_by_name(db: Session, city_name: str) -> Optional[City]:
        return db.query(City).filter(City.city_name == city_name).first()
    
    @staticmethod
    def create_city(db: Session, city: CityCreate) -> City:
        db_city = City(**city.model_dump())
        db.add(db_city)
        db.commit()
        db.refresh(db_city)
        return db_city
    
    @staticmethod
    def get_all_indicators(db: Session) -> List[Indicator]:
        return db.query(Indicator).all()
    
    @staticmethod
    def get_indicator_by_id(db: Session, indicator_id: int) -> Optional[Indicator]:
        return db.query(Indicator).filter(Indicator.indicator_id == indicator_id).first()
    
    @staticmethod
    def get_indicator_by_code(db: Session, indicator_code: str) -> Optional[Indicator]:
        return db.query(Indicator).filter(Indicator.indicator_code == indicator_code).first()
    
    @staticmethod
    def create_indicator(db: Session, indicator: IndicatorCreate) -> Indicator:
        db_indicator = Indicator(**indicator.model_dump())
        db.add(db_indicator)
        db.commit()
        db.refresh(db_indicator)
        return db_indicator
    
    @staticmethod
    def get_annual_data(
        db: Session,
        city_id: Optional[int] = None,
        indicator_id: Optional[int] = None,
        year: Optional[int] = None,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None
    ) -> List[AnnualData]:
        query = db.query(AnnualData)
        
        if city_id is not None:
            query = query.filter(AnnualData.city_id == city_id)
        if indicator_id is not None:
            query = query.filter(AnnualData.indicator_id == indicator_id)
        if year is not None:
            query = query.filter(AnnualData.year == year)
        if start_year is not None:
            query = query.filter(AnnualData.year >= start_year)
        if end_year is not None:
            query = query.filter(AnnualData.year <= end_year)
        
        return query.order_by(AnnualData.year).all()
    
    @staticmethod
    def get_timeseries_data(
        db: Session,
        city_id: int,
        indicator_id: int,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None
    ) -> Dict[str, Any]:
        city = DataService.get_city_by_id(db, city_id)
        indicator = DataService.get_indicator_by_id(db, indicator_id)
        
        data = DataService.get_annual_data(
            db, city_id=city_id, indicator_id=indicator_id,
            start_year=start_year, end_year=end_year
        )
        
        return {
            "city_id": city_id,
            "city_name": city.city_name if city else "",
            "indicator_id": indicator_id,
            "indicator_name": indicator.indicator_name if indicator else "",
            "unit": indicator.unit if indicator else "",
            "data": [{"year": d.year, "value": float(d.value) if d.value else None} for d in data]
        }
    
    @staticmethod
    def create_annual_data(db: Session, data: AnnualDataCreate) -> AnnualData:
        db_data = AnnualData(**data.model_dump())
        db.add(db_data)
        db.commit()
        db.refresh(db_data)
        return db_data
    
    @staticmethod
    def batch_create_annual_data(db: Session, data_list: List[AnnualDataCreate]) -> List[AnnualData]:
        db_data_list = [AnnualData(**data.model_dump()) for data in data_list]
        db.add_all(db_data_list)
        db.commit()
        for data in db_data_list:
            db.refresh(data)
        return db_data_list
    
    @staticmethod
    def get_regional_summary(db: Session, year: int) -> Dict[str, Any]:
        gdp_indicator = db.query(Indicator).filter(Indicator.indicator_code == "gdp").first()
        population_indicator = db.query(Indicator).filter(Indicator.indicator_code == "population").first()
        trade_indicator = db.query(Indicator).filter(Indicator.indicator_code == "total_trade").first()
        
        result = {}
        
        if gdp_indicator:
            gdp_data = db.query(AnnualData).filter(
                and_(
                    AnnualData.indicator_id == gdp_indicator.indicator_id,
                    AnnualData.year == year
                )
            ).all()
            result["total_gdp"] = sum(float(d.value) for d in gdp_data if d.value)
        
        if population_indicator:
            pop_data = db.query(AnnualData).filter(
                and_(
                    AnnualData.indicator_id == population_indicator.indicator_id,
                    AnnualData.year == year
                )
            ).all()
            result["total_population"] = sum(float(d.value) for d in pop_data if d.value)
        
        if trade_indicator:
            trade_data = db.query(AnnualData).filter(
                and_(
                    AnnualData.indicator_id == trade_indicator.indicator_id,
                    AnnualData.year == year
                )
            ).all()
            result["total_trade"] = sum(float(d.value) for d in trade_data if d.value)
        
        return result
    
    @staticmethod
    def get_city_ranking(db: Session, indicator_id: int, year: int) -> List[Dict[str, Any]]:
        indicator = DataService.get_indicator_by_id(db, indicator_id)
        
        data = db.query(AnnualData, City).join(
            City, AnnualData.city_id == City.city_id
        ).filter(
            and_(
                AnnualData.indicator_id == indicator_id,
                AnnualData.year == year,
                AnnualData.value.isnot(None)
            )
        ).order_by(AnnualData.value.desc()).all()
        
        return [
            {
                "rank": idx + 1,
                "city_id": city.city_id,
                "city_name": city.city_name,
                "value": float(annual_data.value)
            }
            for idx, (annual_data, city) in enumerate(data)
        ]
