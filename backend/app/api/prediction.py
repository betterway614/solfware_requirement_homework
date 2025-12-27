from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.models.schemas import PredictionRequest, PredictionResult
from app.services.prediction_service import PredictionService

router = APIRouter()


@router.post("/predict/linear")
def predict_linear_regression(request: PredictionRequest, db: Session = Depends(get_db)):
    result = PredictionService.linear_regression_prediction(
        db,
        request.city_id,
        request.indicator_id,
        request.prediction_years,
        request.confidence_level
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/predict/arima")
def predict_arima(request: PredictionRequest, db: Session = Depends(get_db)):
    result = PredictionService.arima_prediction(
        db,
        request.city_id,
        request.indicator_id,
        request.prediction_years
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/predict/ensemble")
def predict_ensemble(request: PredictionRequest, db: Session = Depends(get_db)):
    result = PredictionService.ensemble_prediction(
        db,
        request.city_id,
        request.indicator_id,
        request.prediction_years,
        request.confidence_level
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/predict/simulation")
def predict_simulation(
    city_id: int,
    indicator_id: int,
    scenario_params: Dict[str, float],
    prediction_years: int = 3,
    db: Session = Depends(get_db)
):
    result = PredictionService.scenario_simulation(
        db,
        city_id,
        indicator_id,
        scenario_params,
        prediction_years
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result
