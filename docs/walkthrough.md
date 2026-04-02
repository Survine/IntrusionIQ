# IntrusionIQ — Data Cleaning Module Walkthrough

## What Was Built

Restructured the ML module into a **notebook-first architecture** where Jupyter notebooks do the actual work, and [.py](file:///tmp/test_pipeline.py) files provide shared config + reusable helpers.

## Final Structure

```
ml/
├── config.py                  ← All settings, paths, hyperparams in one place
├── notebooks/
│   ├── 01_eda.ipynb           ← (you create these)
│   ├── 02_data_cleaning.ipynb
│   └── 03_model_training.ipynb
├── src/
│   ├── __init__.py
│   ├── utils.py               ← Reusable functions notebooks import
│   └── predict.py             ← Backend inference (only .py the API uses)
├── data/
│   ├── raw/                   ← Put CICIDS2017 CSVs here
│   └── processed/             ← Cleaned Parquet outputs land here
├── artifacts/                 ← Saved models, scalers, label mappings
├── reports/                   ← Generated plots & metrics JSON
└── requirements.txt           ← Latest pinned versions
```

## How to Use in Notebooks

Every notebook starts with the same 3-line setup:

```python
import sys
sys.path.insert(0, "..")
from config import *
from src.utils import *
```

### Sample `02_data_cleaning.ipynb` Cell Flow

```python
# Cell 1 — Setup
import sys
sys.path.insert(0, "..")
from config import *
from src.utils import *

# Cell 2 — Load raw data
df = load_raw_csvs(DATA_RAW_DIR)
df.head()

# Cell 3 — Data quality check
report = get_data_quality_report(df)
report

# Cell 4 — Drop identifier columns
df = drop_id_columns(df, COLUMNS_TO_DROP)

# Cell 5 — Fix infinities & NaN
df = fix_invalid_values(df)

# Cell 6 — Remove duplicates
df = remove_duplicates(df)

# Cell 7 — Encode labels
df, label_mapping, attack_types = encode_labels_binary(df, LABEL_COLUMN, BENIGN_LABEL)

# Cell 8 — Split + Scale
X_train, X_test, y_train, y_test, scaler = split_and_scale(
    df, LABEL_COLUMN, TEST_SIZE, RANDOM_STATE
)

# Cell 9 — SMOTE (train only)
X_train, y_train = apply_smote(X_train, y_train, RANDOM_STATE)

# Cell 10 — Save everything
save_processed_data(X_train, X_test, y_train, y_test, DATA_PROCESSED_DIR)
save_artifacts(
    scaler=scaler,
    label_mapping=label_mapping,
    feature_names=list(X_test.columns),
    metadata={
        "train_shape": list(X_train.shape),
        "test_shape": list(X_test.shape),
        "smote_applied": True,
    },
    artifacts_dir=ARTIFACTS_DIR,
)
```

## Files Created

| File | Purpose |
|------|---------|
| [config.py](file:///d:/IntrusionIQ/ml/config.py) | Paths, constants, hyperparameters |
| [utils.py](file:///d:/IntrusionIQ/ml/src/utils.py) | 10 reusable functions for notebooks |
| [predict.py](file:///d:/IntrusionIQ/ml/src/predict.py) | [IntrusionPredictor](file:///d:/IntrusionIQ/ml/src/predict.py#23-117) class for backend |
| [requirements.txt](file:///d:/IntrusionIQ/ml/requirements.txt) | Latest deps (scikit-learn 1.8, xgboost 3.2, pandas 3.0) |
| [.gitignore](file:///d:/IntrusionIQ/.gitignore) | Python, Node, ML data, env files |

## Verified

- All imports from [config.py](file:///d:/IntrusionIQ/ml/config.py), [utils.py](file:///d:/IntrusionIQ/ml/src/utils.py), and [predict.py](file:///d:/IntrusionIQ/ml/src/predict.py) pass ✓

## Next Steps

1. Download CICIDS2017 CSVs → place in `ml/data/raw/`
2. Create `notebooks/02_data_cleaning.ipynb` using the cell flow above
3. Run the notebook to generate processed data in `ml/data/processed/`
