import pandas as pd
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.database import City, Indicator, AnnualData
from app.services.data_service import DataService
import os


def load_csv_data(csv_path):
    """加载CSV数据"""
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
        print(f"成功加载CSV文件: {csv_path}")
        print(f"数据形状: {df.shape}")
        print(f"列名: {df.columns.tolist()}")
        return df
    except Exception as e:
        print(f"加载CSV文件失败: {e}")
        return None


def get_city_id(session, city_name):
    """获取城市ID，不存在则创建"""
    city = session.query(City).filter(City.city_name == city_name).first()
    return city.city_id if city else None


def get_indicator_id(session, indicator_name):
    """获取指标ID，不存在则创建"""
    indicator = session.query(Indicator).filter(Indicator.indicator_name == indicator_name).first()
    return indicator.indicator_id if indicator else None


def map_indicator_name(indicator_name):
    """映射CSV中的指标名称到数据库中的指标名称"""
    mapping = {
        '地区生产总值(亿元)': '地区生产总值',
        '进出口总额(亿美元)': '进出口总额',
        '货物出口货值(亿美元)': '货物出口货值',
        '货物进口货值(亿美元)': '货物进口货值',
        '零售业销售额(亿元)': '零售业销售额',
        '城市人口(万人)': '城市人口',
        '留宿旅客(万人)': '留宿旅客',
        '流动电话用户数目(万户)': '流动电话用户数目'
    }
    return mapping.get(indicator_name, indicator_name)


def import_data_to_db(csv_path):
    """将CSV数据导入到数据库"""
    df = load_csv_data(csv_path)
    if df is None:
        return

    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 确保城市和指标表已初始化
        print("检查城市和指标数据...")
        cities = db.query(City).all()
        indicators = db.query(Indicator).all()
        
        if len(cities) == 0:
            print("城市数据未初始化，请先运行 python -m app.db.init_db")
            return
        
        if len(indicators) == 0:
            print("指标数据未初始化，请先运行 python -m app.db.init_db")
            return
        
        print(f"数据库中已有 {len(cities)} 个城市和 {len(indicators)} 个指标")
        
        # 遍历CSV数据，准备插入
        print("准备导入数据...")
        success_count = 0
        skip_count = 0
        
        # 遍历CSV的每一行
        for index, row in df.iterrows():
            city_name = row['城市名称']
            year = row['年份']
            
            # 跳过无效数据
            if pd.isna(city_name) or pd.isna(year):
                skip_count += 1
                continue
            
            city_id = get_city_id(db, city_name)
            if not city_id:
                print(f"跳过无效城市: {city_name}")
                skip_count += 1
                continue
            
            # 遍历所有指标列
            for col in df.columns:
                if col in ['城市名称', '年份']:
                    continue
                
                indicator_name = map_indicator_name(col)
                indicator_id = get_indicator_id(db, indicator_name)
                
                if not indicator_id:
                    print(f"跳过无效指标: {indicator_name}")
                    continue
                
                value = row[col]
                if pd.isna(value):
                    continue
                
                # 检查数据是否已存在
                existing_data = db.query(AnnualData).filter(
                    AnnualData.city_id == city_id,
                    AnnualData.indicator_id == indicator_id,
                    AnnualData.year == year
                ).first()
                
                if existing_data:
                    skip_count += 1
                    continue
                
                # 创建新数据记录
                annual_data = AnnualData(
                    city_id=city_id,
                    indicator_id=indicator_id,
                    year=year,
                    value=float(value),
                    data_quality='normal',
                    data_source='CSV导入'
                )
                
                db.add(annual_data)
                success_count += 1
                
                # 每100条数据提交一次
                if success_count % 100 == 0:
                    db.commit()
                    print(f"已导入 {success_count} 条数据")
        
        # 提交剩余数据
        db.commit()
        
        print(f"\n数据导入完成！")
        print(f"成功导入: {success_count} 条数据")
        print(f"跳过: {skip_count} 条数据")
        
    except Exception as e:
        print(f"数据导入失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    csv_file_path = "../data/大湾区补充数据年.csv"
    
    if not os.path.exists(csv_file_path):
        csv_file_path = "./data/大湾区补充数据年.csv"
    
    if not os.path.exists(csv_file_path):
        print(f"CSV文件不存在: {csv_file_path}")
        exit(1)
    
    print(f"开始导入数据: {csv_file_path}")
    import_data_to_db(csv_file_path)
    print("数据导入脚本执行完毕！")
