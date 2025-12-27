from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from statsmodels.tsa.arima.model import ARIMA
from app.services.data_service import DataService
from app.models.database import PredictionModel, Prediction


class PredictionService:
    
    @staticmethod
    def linear_regression_prediction(
        db: Session,
        city_id: int,
        indicator_id: int,
        prediction_years: int = 3,
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        city = DataService.get_city_by_id(db, city_id)
        indicator = DataService.get_indicator_by_id(db, indicator_id)
        
        data = DataService.get_annual_data(
            db, city_id=city_id, indicator_id=indicator_id
        )
        
        valid_data = [(d.year, float(d.value)) for d in data if d.value is not None]
        
        if len(valid_data) < 5:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "model_type": "linear_regression",
                "error": "历史数据不足，至少需要5年数据"
            }
        
        years = np.array([d[0] for d in valid_data]).reshape(-1, 1)
        values = np.array([d[1] for d in valid_data])
        
        model = LinearRegression()
        model.fit(years, values)
        
        predictions = []
        last_year = int(years[-1][0])  # 转换为Python int
        
        for i in range(1, prediction_years + 1):
            pred_year = last_year + i
            pred_value = float(model.predict([[pred_year]])[0])  # 转换为Python float
            
            # 计算标准误差并转换为Python float
            std_error = float(np.sqrt(mean_squared_error(values, model.predict(years))))
            # 使用scipy计算z分数，支持任何置信度值
            alpha = 1 - confidence_level
            z_score = float(stats.norm.ppf(1 - alpha / 2))
            
            predictions.append({
                "year": pred_year,
                "predicted_value": round(pred_value, 2),
                "confidence_lower": round(pred_value - z_score * std_error, 2),
                "confidence_upper": round(pred_value + z_score * std_error, 2)
            })
        
        # 转换所有评估指标为Python float
        r2 = float(r2_score(values, model.predict(years)))
        mse = float(mean_squared_error(values, model.predict(years)))
        mae = float(mean_absolute_error(values, model.predict(years)))
        
        return {
            "city": city.city_name if city else "",
            "indicator": indicator.indicator_name if indicator else "",
            "unit": indicator.unit if indicator else "",
            "model_type": "linear_regression",
            "predictions": predictions,
            "accuracy": {
                "r_squared": round(r2, 4),
                "mse": round(mse, 4),
                "mae": round(mae, 4)
            },
            "training_years": [int(y) for y in years.flatten()],  # 确保是Python int
            "training_values": [round(float(v), 2) for v in values]  # 确保是Python float
        }
    
    @staticmethod
    def arima_prediction(
        db: Session,
        city_id: int,
        indicator_id: int,
        prediction_years: int = 3,
        confidence_level: float = 0.95,
        order: tuple = (1, 1, 1)
    ) -> Dict[str, Any]:
        city = DataService.get_city_by_id(db, city_id)
        indicator = DataService.get_indicator_by_id(db, indicator_id)
        
        data = DataService.get_annual_data(
            db, city_id=city_id, indicator_id=indicator_id
        )
        
        valid_data = [(d.year, float(d.value)) for d in data if d.value is not None]
        
        if len(valid_data) < 10:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "model_type": "arima",
                "error": "历史数据不足，ARIMA模型至少需要10年数据"
            }
        
        years = [d[0] for d in valid_data]
        values = [d[1] for d in valid_data]
        
        try:
            model = ARIMA(values, order=order)
            model_fit = model.fit()
            
            forecast = model_fit.forecast(steps=prediction_years)
            alpha = 1 - confidence_level  # 从置信度计算alpha值
            forecast_confint = model_fit.get_forecast(steps=prediction_years).conf_int(alpha=alpha)
            
            predictions = []
            last_year = int(years[-1])  # 转换为Python int
            
            for i, pred in enumerate(forecast):
                pred_year = last_year + i + 1
                predictions.append({
                    "year": pred_year,
                    "predicted_value": round(float(pred), 2),
                    "confidence_lower": round(float(forecast_confint[i, 0]), 2),
                    "confidence_upper": round(float(forecast_confint[i, 1]), 2)
                })
            
            # 转换为Python float
            aic = float(model_fit.aic)
            bic = float(model_fit.bic)
            
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "unit": indicator.unit if indicator else "",
                "model_type": "arima",
                "order": order,
                "predictions": predictions,
                "accuracy": {
                    "aic": round(aic, 4),
                    "bic": round(bic, 4)
                },
                "training_years": [int(y) for y in years],  # 确保是Python int列表
                "training_values": [round(float(v), 2) for v in values]  # 确保是Python float列表
            }
        
        except Exception as e:
            return {
                "city": city.city_name if city else "",
                "indicator": indicator.indicator_name if indicator else "",
                "model_type": "arima",
                "error": f"ARIMA模型拟合失败: {str(e)}"
            }
    
    @staticmethod
    def ensemble_prediction(
        db: Session,
        city_id: int,
        indicator_id: int,
        prediction_years: int = 3,
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        lr_result = PredictionService.linear_regression_prediction(
            db, city_id, indicator_id, prediction_years, confidence_level
        )
        
        arima_result = PredictionService.arima_prediction(
            db, city_id, indicator_id, prediction_years, confidence_level
        )
        
        if "error" in lr_result and "error" in arima_result:
            return {
                "city": lr_result.get("city", ""),
                "indicator": lr_result.get("indicator", ""),
                "model_type": "ensemble",
                "error": "所有模型预测失败"
            }
        
        predictions = []
        
        if "error" not in lr_result and "error" not in arima_result:
            for i in range(prediction_years):
                lr_pred = lr_result["predictions"][i]["predicted_value"]
                arima_pred = arima_result["predictions"][i]["predicted_value"]
                
                ensemble_pred = (lr_pred + arima_pred) / 2
                
                lr_lower = lr_result["predictions"][i]["confidence_lower"]
                lr_upper = lr_result["predictions"][i]["confidence_upper"]
                arima_lower = arima_result["predictions"][i]["confidence_lower"]
                arima_upper = arima_result["predictions"][i]["confidence_upper"]
                
                predictions.append({
                    "year": lr_result["predictions"][i]["year"],
                    "predicted_value": round(ensemble_pred, 2),
                    "confidence_lower": round((lr_lower + arima_lower) / 2, 2),
                    "confidence_upper": round((lr_upper + arima_upper) / 2, 2),
                    "lr_prediction": lr_pred,
                    "arima_prediction": arima_pred
                })
            
            # 计算集成模型的准确性指标
            lr_accuracy = lr_result.get("accuracy", {})
            arima_accuracy = arima_result.get("accuracy", {})
            
            # 如果线性回归有R²，使用它作为集成模型的R²
            accuracy = {
                **lr_accuracy,  # 使用线性回归的准确性指标
                "components": {
                    "linear_regression": lr_accuracy,
                    "arima": arima_accuracy
                }
            }
            
            return {
                "city": lr_result["city"],
                "indicator": lr_result["indicator"],
                "unit": lr_result.get("unit", ""),
                "model_type": "ensemble",
                "predictions": predictions,
                "accuracy": accuracy,
                "training_years": lr_result.get("training_years", []),
                "training_values": lr_result.get("training_values", [])
            }
        
        return lr_result if "error" not in lr_result else arima_result
    
    @staticmethod
    def scenario_simulation(
        db: Session,
        city_id: int,
        indicator_id: int,
        scenario_params: Dict[str, float],
        prediction_years: int = 3
    ) -> Dict[str, Any]:
        base_prediction = PredictionService.linear_regression_prediction(
            db, city_id, indicator_id, prediction_years
        )
        
        if "error" in base_prediction:
            return base_prediction
        
        scenarios = {}
        
        for scenario_name, growth_factor in scenario_params.items():
            adjusted_predictions = []
            
            for pred in base_prediction["predictions"]:
                adjusted_value = pred["predicted_value"] * (1 + growth_factor / 100)
                adjusted_predictions.append({
                    "year": pred["year"],
                    "predicted_value": round(adjusted_value, 2),
                    "confidence_lower": round(pred["confidence_lower"] * (1 + growth_factor / 100), 2),
                    "confidence_upper": round(pred["confidence_upper"] * (1 + growth_factor / 100), 2)
                })
            
            scenarios[scenario_name] = adjusted_predictions
        
        return {
            "city": base_prediction["city"],
            "indicator": base_prediction["indicator"],
            "unit": base_prediction.get("unit", ""),
            "model_type": "scenario_simulation",
            "base_prediction": base_prediction["predictions"],
            "scenarios": scenarios
        }
