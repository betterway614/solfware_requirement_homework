from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.database import City, Indicator
from app.models.schemas import CityCreate, IndicatorCreate

CITIES_DATA = [
    {"city_name": "广州", "city_code": "GZ", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "深圳", "city_code": "SZ", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "佛山", "city_code": "FS", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "东莞", "city_code": "DG", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "中山", "city_code": "ZS", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "惠州", "city_code": "HZ", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "江门", "city_code": "JM", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "肇庆", "city_code": "ZQ", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "珠海", "city_code": "ZH", "city_type": "mainland", "region": "珠三角"},
    {"city_name": "香港", "city_code": "HK", "city_type": "hk_macau", "region": "港澳"},
    {"city_name": "澳门", "city_code": "MO", "city_type": "hk_macau", "region": "港澳"},
]

INDICATORS_DATA = [
    {
        "indicator_name": "地区生产总值",
        "indicator_code": "gdp",
        "unit": "亿元",
        "category": "经济指标",
        "description": "核心经济总量指标"
    },
    {
        "indicator_name": "进出口总额",
        "indicator_code": "total_trade",
        "unit": "亿美元",
        "category": "贸易指标",
        "description": "对外贸易规模"
    },
    {
        "indicator_name": "货物出口货值",
        "indicator_code": "export_value",
        "unit": "亿美元",
        "category": "贸易指标",
        "description": "出口创汇能力"
    },
    {
        "indicator_name": "货物进口货值",
        "indicator_code": "import_value",
        "unit": "亿美元",
        "category": "贸易指标",
        "description": "进口需求能力"
    },
    {
        "indicator_name": "零售业销售额",
        "indicator_code": "retail_sales",
        "unit": "亿元",
        "category": "消费指标",
        "description": "内需市场活力"
    },
    {
        "indicator_name": "城市人口",
        "indicator_code": "population",
        "unit": "万人",
        "category": "人口指标",
        "description": "城市规模与人口红利"
    },
    {
        "indicator_name": "留宿旅客",
        "indicator_code": "overnight_tourists",
        "unit": "万人",
        "category": "旅游指标",
        "description": "旅游吸引能力"
    },
    {
        "indicator_name": "流动电话用户数目",
        "indicator_code": "mobile_phone_users",
        "unit": "万户",
        "category": "通信指标",
        "description": "数字化水平"
    },
]


def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        existing_cities = db.query(City).count()
        if existing_cities == 0:
            for city_data in CITIES_DATA:
                city = City(**city_data)
                db.add(city)
            db.commit()
            print(f"成功初始化 {len(CITIES_DATA)} 个城市")
        else:
            print(f"城市数据已存在，共 {existing_cities} 个城市")
        
        existing_indicators = db.query(Indicator).count()
        if existing_indicators == 0:
            for indicator_data in INDICATORS_DATA:
                indicator = Indicator(**indicator_data)
                db.add(indicator)
            db.commit()
            print(f"成功初始化 {len(INDICATORS_DATA)} 个指标")
        else:
            print(f"指标数据已存在，共 {existing_indicators} 个指标")
        
        print("数据库初始化完成！")
        
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
