from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class City(Base):
    __tablename__ = "cities"
    
    city_id = Column(Integer, primary_key=True, index=True)
    city_name = Column(String(50), unique=True, nullable=False, index=True)
    city_code = Column(String(10), nullable=False)
    city_type = Column(String(20), nullable=False)
    region = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    annual_data = relationship("AnnualData", back_populates="city")


class Indicator(Base):
    __tablename__ = "indicators"
    
    indicator_id = Column(Integer, primary_key=True, index=True)
    indicator_name = Column(String(100), unique=True, nullable=False, index=True)
    indicator_code = Column(String(20), nullable=False)
    unit = Column(String(20))
    category = Column(String(50))
    description = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    annual_data = relationship("AnnualData", back_populates="indicator")


class AnnualData(Base):
    __tablename__ = "annual_data"
    
    data_id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.city_id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("indicators.indicator_id"), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    value = Column(DECIMAL(20, 4))
    data_quality = Column(String(20), default="normal")
    data_source = Column(String(100))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    city = relationship("City", back_populates="annual_data")
    indicator = relationship("Indicator", back_populates="annual_data")


class PredictionModel(Base):
    __tablename__ = "prediction_models"
    
    model_id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    model_params = Column(JSON)
    training_start_year = Column(Integer)
    training_end_year = Column(Integer)
    accuracy_score = Column(DECIMAL(10, 6))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    predictions = relationship("Prediction", back_populates="model")


class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("prediction_models.model_id"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.city_id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("indicators.indicator_id"), nullable=False)
    year = Column(Integer, nullable=False)
    predicted_value = Column(DECIMAL(20, 4))
    confidence_lower = Column(DECIMAL(20, 4))
    confidence_upper = Column(DECIMAL(20, 4))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    model = relationship("PredictionModel", back_populates="predictions")
