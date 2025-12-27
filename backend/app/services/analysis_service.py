from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from app.services.data_service import DataService


class AnalysisService:
    
    @staticmethod
    def compare_cities(
        db: Session,
        city_ids: List[int],
        indicator_ids: List[int],
        start_year: Optional[int] = None,
        end_year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        results = []
        
        for indicator_id in indicator_ids:
            indicator = DataService.get_indicator_by_id(db, indicator_id)
            if not indicator:
                continue
            
            indicator_data = {
                "indicator_id": indicator_id,
                "indicator_name": indicator.indicator_name,
                "unit": indicator.unit,
                "cities": []
            }
            
            for city_id in city_ids:
                city = DataService.get_city_by_id(db, city_id)
                if not city:
                    continue
                
                data = DataService.get_annual_data(
                    db, city_id=city_id, indicator_id=indicator_id,
                    start_year=start_year, end_year=end_year
                )
                
                city_data = {
                    "city_id": city_id,
                    "city_name": city.city_name,
                    "values": {d.year: float(d.value) if d.value else None for d in data}
                }
                
                if city_data["values"]:
                    valid_values = [v for v in city_data["values"].values() if v is not None]
                    if valid_values:
                        city_data["avg_value"] = np.mean(valid_values)
                        city_data["min_value"] = np.min(valid_values)
                        city_data["max_value"] = np.max(valid_values)
                        city_data["latest_value"] = valid_values[-1]
                    
                    if len(valid_values) >= 2:
                        years = list(city_data["values"].keys())
                        values = [city_data["values"][y] for y in years if city_data["values"][y] is not None]
                        if len(values) >= 2:
                            growth_rate = ((values[-1] - values[0]) / values[0]) * 100
                            city_data["growth_rate"] = growth_rate
                
                indicator_data["cities"].append(city_data)
            
            results.append(indicator_data)
        
        return results
    
    @staticmethod
    def calculate_correlation(
        db: Session,
        city_ids: List[int],
        indicator_ids: List[int],
        start_year: Optional[int] = None,
        end_year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        correlations = []
        
        for i in range(len(indicator_ids)):
            for j in range(i + 1, len(indicator_ids)):
                ind1 = DataService.get_indicator_by_id(db, indicator_ids[i])
                ind2 = DataService.get_indicator_by_id(db, indicator_ids[j])
                
                if not ind1 or not ind2:
                    continue
                
                values1 = []
                values2 = []
                
                for city_id in city_ids:
                    data1 = DataService.get_annual_data(
                        db, city_id=city_id, indicator_id=indicator_ids[i],
                        start_year=start_year, end_year=end_year
                    )
                    data2 = DataService.get_annual_data(
                        db, city_id=city_id, indicator_id=indicator_ids[j],
                        start_year=start_year, end_year=end_year
                    )
                    
                    for d1 in data1:
                        for d2 in data2:
                            if d1.year == d2.year and d1.value and d2.value:
                                values1.append(float(d1.value))
                                values2.append(float(d2.value))
                
                if len(values1) >= 3:
                    corr, p_value = stats.pearsonr(values1, values2)
                    correlations.append({
                        "indicator_1": ind1.indicator_name,
                        "indicator_2": ind2.indicator_name,
                        "correlation": round(corr, 4),
                        "p_value": round(p_value, 4),
                        "strength": AnalysisService._get_correlation_strength(abs(corr))
                    })
        
        return correlations
    
    @staticmethod
    def _get_correlation_strength(corr: float) -> str:
        if corr >= 0.8:
            return "强相关"
        elif corr >= 0.6:
            return "中等相关"
        elif corr >= 0.4:
            return "弱相关"
        else:
            return "极弱相关"
    
    @staticmethod
    def analyze_trend(
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
        
        valid_data = [(d.year, float(d.value)) for d in data if d.value is not None]
        
        if len(valid_data) < 2:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "error": "数据不足，无法进行趋势分析"
            }
        
        years = np.array([d[0] for d in valid_data]).reshape(-1, 1)
        values = np.array([d[1] for d in valid_data])
        
        model = LinearRegression()
        model.fit(years, values)
        
        predictions = model.predict(years)
        r_squared = r2_score(values, predictions)
        
        slope = model.coef_[0]
        intercept = model.intercept_
        
        growth_rate = None
        if len(valid_data) >= 2:
            growth_rate = ((values[-1] - values[0]) / values[0]) * 100
        
        return {
            "city": city.city_name if city else "",
            "indicator": indicator.indicator_name if indicator else "",
            "unit": indicator.unit if indicator else "",
            "slope": round(slope, 4),
            "intercept": round(intercept, 4),
            "r_squared": round(r_squared, 4),
            "growth_rate": round(growth_rate, 2) if growth_rate is not None else None,
            "trend": "上升" if slope > 0 else "下降" if slope < 0 else "平稳",
            "data_points": len(valid_data)
        }
    
    @staticmethod
    def calculate_growth_rate(
        db: Session,
        city_id: int,
        indicator_id: int,
        year: int
    ) -> Dict[str, Any]:
        city = DataService.get_city_by_id(db, city_id)
        indicator = DataService.get_indicator_by_id(db, indicator_id)
        
        current_data = db.query(AnnualData).filter(
            AnnualData.city_id == city_id,
            AnnualData.indicator_id == indicator_id,
            AnnualData.year == year
        ).first()
        
        previous_data = db.query(AnnualData).filter(
            AnnualData.city_id == city_id,
            AnnualData.indicator_id == indicator_id,
            AnnualData.year == year - 1
        ).first()
        
        if not current_data or not previous_data:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "year": year,
                "error": "数据不完整"
            }
        
        if not current_data.value or not previous_data.value:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "year": year,
                "error": "数据缺失"
            }
        
        current_value = float(current_data.value)
        previous_value = float(previous_data.value)
        
        growth_rate = ((current_value - previous_value) / previous_value) * 100
        
        return {
            "city": city.city_name if city else "",
            "indicator": indicator.indicator_name if indicator else "",
            "unit": indicator.unit if indicator else "",
            "year": year,
            "current_value": current_value,
            "previous_value": previous_value,
            "growth_rate": round(growth_rate, 2),
            "trend": "上升" if growth_rate > 0 else "下降" if growth_rate < 0 else "持平"
        }
    
    @staticmethod
    def get_ranking_history(
        db: Session,
        indicator_id: int,
        start_year: int,
        end_year: int
    ) -> Dict[int, List[Dict[str, Any]]]:
        ranking_history = {}
        
        for year in range(start_year, end_year + 1):
            rankings = DataService.get_city_ranking(db, indicator_id, year)
            ranking_history[year] = rankings
        
        return ranking_history


from app.models.database import AnnualData
