# IntrusionIQ — Complete ML Pipeline Guide

A **cell-by-cell** walkthrough of the 3 notebooks you'll build.
Each code block = one Jupyter cell. Run them **in order**.

> [!IMPORTANT]
> **Before you start:** download the CICIDS2017 CSVs (Monday + Tuesday files) from [Kaggle](https://www.kaggle.com/datasets/ciaboroniu/cicids2017) and put them in `ml/data/raw/`.

---

## Prerequisites — Install Dependencies

Open a terminal in `ml/` and run:

```bash
pip install -r requirements.txt
```

This installs pandas, numpy, scikit-learn, xgboost, imbalanced-learn, matplotlib, seaborn, and pyarrow.

---

---

# 📓 Notebook 1 — `01_eda.ipynb` (Exploratory Data Analysis)

**Goal:** Look at your data *before* touching it. Understand what you have, find problems, and decide what to clean.

> [!NOTE]
> EDA = "Exploratory Data Analysis". Think of it like a doctor examining a patient before surgery. You need to know what's wrong before you can fix it.

---

### Cell 1 — Imports

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings

warnings.filterwarnings("ignore")
sns.set_theme(style="darkgrid")
plt.rcParams["figure.figsize"] = (12, 6)

print("✅ Libraries loaded")
```

**Why?**
- `pandas` — reads CSV files and lets you manipulate tables (called DataFrames)
- `numpy` — math on arrays (pandas uses it internally)
- `matplotlib` + `seaborn` — drawing charts/graphs
- `warnings.filterwarnings("ignore")` — hides noisy warning messages so your output is clean
- `sns.set_theme(style="darkgrid")` — makes graphs look professional with grid lines

---

### Cell 2 — Load the Dataset

```python
# Path to your raw CSVs
RAW_DIR = Path("../data/raw")

# Find all CSV files in the folder
csv_files = sorted(RAW_DIR.glob("*.csv"))
print(f"Found {len(csv_files)} CSV files:")
for f in csv_files:
    print(f"  📄 {f.name}")
```

**Why?**
- We point to `../data/raw` because the notebook is inside `notebooks/`, so `..` goes up to `ml/`.
- `.glob("*.csv")` finds every file ending in `.csv`.
- We print the file names to confirm they loaded correctly.

---

### Cell 3 — Read and Combine CSVs

```python
# Read each CSV and combine into one big DataFrame
dfs = []
for f in csv_files:
    print(f"Reading {f.name}...")
    temp = pd.read_csv(f, encoding="utf-8", low_memory=False)
    print(f"  → {temp.shape[0]:,} rows, {temp.shape[1]} columns")
    dfs.append(temp)

df = pd.concat(dfs, ignore_index=True)

# Strip whitespace from column names (CICIDS2017 has " Label" with a space!)
df.columns = df.columns.str.strip()

print(f"\n📊 Combined dataset: {df.shape[0]:,} rows × {df.shape[1]} columns")
```

**Why?**
- CICIDS2017 comes as multiple CSV files (one per day). We read them all and stack them into one big table.
- `ignore_index=True` resets row numbers (0, 1, 2…) after combining.
- **Column name stripping** is critical! The CICIDS2017 CSVs have column names like `" Label"` with a leading space. If you don't strip it, `df["Label"]` will fail later.

---

### Cell 4 — First Look at the Data

```python
# See the first 5 rows
df.head()
```

**Why?** You want to see what the data actually looks like — column names, sample values, data types.

---

### Cell 5 — Dataset Shape and Column List

```python
print(f"Rows: {df.shape[0]:,}")
print(f"Columns: {df.shape[1]}")
print("\n📋 All column names:")
for i, col in enumerate(df.columns, 1):
    print(f"  {i:>3}. {col}")
```

**Why?** CICIDS2017 has ~80 columns (network traffic features). You need to know what's there.

---

### Cell 6 — Data Types

```python
df.dtypes.value_counts()
```

**Why?** Most columns should be numbers (`float64`, `int64`). If any are `object` (text), that's a problem we'll need to fix (except the `Label` column).

---

### Cell 7 — Check for Missing Values (NaN)

```python
# Count missing values per column
missing = df.isnull().sum()
missing_pct = (missing / len(df)) * 100

# Show only columns that HAVE missing values
missing_report = pd.DataFrame({
    "Missing Count": missing,
    "Missing %": missing_pct.round(2)
}).query("`Missing Count` > 0").sort_values("Missing %", ascending=False)

if missing_report.empty:
    print("✅ No missing values found!")
else:
    print(f"⚠️ {len(missing_report)} columns have missing values:\n")
    print(missing_report)
```

**Why?**
- ML models cannot handle `NaN` (Not a Number) values — they'll crash.
- We need to know *which* columns have missing data and *how much* is missing.
- If only 0.01% of a column is missing → fill it. If 90% is missing → maybe drop the column entirely.

---

### Cell 8 — Check for Infinity Values

```python
# Select only numeric columns
numeric_cols = df.select_dtypes(include=[np.number]).columns

# Count infinities
inf_counts = np.isinf(df[numeric_cols]).sum()
inf_cols = inf_counts[inf_counts > 0]

if inf_cols.empty:
    print("✅ No infinity values found!")
else:
    print(f"⚠️ {len(inf_cols)} columns have infinity values:\n")
    print(inf_cols)
```

**Why?**
- CICIDS2017 has `inf` (infinity) values in columns like `Flow Bytes/s` — this happens when a network flow has zero duration (division by zero).
- `inf` values will break ML models just like NaN.

---

### Cell 9 — Check for Duplicate Rows

```python
dup_count = df.duplicated().sum()
dup_pct = (dup_count / len(df)) * 100
print(f"Duplicate rows: {dup_count:,} ({dup_pct:.2f}%)")
```

**Why?**
- Duplicates bias the model — it sees the same data point multiple times and "memorizes" it.
- CICIDS2017 typically has thousands of exact duplicates.

---

### Cell 10 — Target Variable Distribution (Label Column)

```python
print("🏷️ Label distribution:\n")
label_counts = df["Label"].value_counts()
print(label_counts)
print(f"\nTotal classes: {label_counts.shape[0]}")

# Plot it
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Bar chart
label_counts.plot(kind="bar", ax=axes[0], color="steelblue", edgecolor="black")
axes[0].set_title("Attack Type Counts")
axes[0].set_ylabel("Number of Rows")
axes[0].tick_params(axis="x", rotation=45)

# Pie chart
label_counts.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=140)
axes[1].set_title("Attack Type Proportions")
axes[1].set_ylabel("")

plt.tight_layout()
plt.savefig("../reports/label_distribution.png", dpi=150, bbox_inches="tight")
plt.show()
print("📁 Saved → reports/label_distribution.png")
```

**Why?**
- The `Label` column tells us if traffic is "BENIGN" (normal) or an attack type.
- This chart reveals **class imbalance** — BENIGN traffic is usually 80%+ of the data.
- If one class dominates, the model can cheat by always guessing that class. We'll fix this later with SMOTE.

---

### Cell 11 — Binary Distribution (What We'll Actually Predict)

```python
# For our project: BENIGN = 0 (normal), everything else = 1 (attack)
binary_labels = df["Label"].apply(lambda x: "BENIGN" if x == "BENIGN" else "ATTACK")
binary_counts = binary_labels.value_counts()

print("🎯 Binary classification split:\n")
print(binary_counts)
print(f"\nAttack ratio: {binary_counts.get('ATTACK', 0) / len(df) * 100:.2f}%")

binary_counts.plot(kind="bar", color=["#10b981", "#ef4444"], edgecolor="black")
plt.title("BENIGN vs ATTACK (Binary)")
plt.ylabel("Count")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig("../reports/binary_distribution.png", dpi=150, bbox_inches="tight")
plt.show()
```

**Why?**
- Our project does **binary classification** (normal vs attack), not multi-class.
- We group all attack types into one "ATTACK" class.
- This shows us the exact split we'll be training on.

---

### Cell 12 — Basic Statistics of Numeric Features

```python
df[numeric_cols].describe().T.round(2)
```

**Why?**
- `.describe()` gives min, max, mean, std, quartiles for every numeric column.
- `.T` transposes it (columns become rows) so it's easier to read with 78+ features.
- Look for: huge ranges (will need scaling), all-zero columns (useless features), extreme values (outliers).

---

### Cell 13 — Correlation Heatmap (Top Features)

```python
# Computing correlation of ALL 78 columns is too cluttered
# Let's pick the top 20 features most correlated with the label
df_temp = df.copy()
df_temp["Label_Binary"] = (df_temp["Label"] != "BENIGN").astype(int)

# Get absolute correlation with the target
corr_with_target = df_temp[numeric_cols].corrwith(df_temp["Label_Binary"]).abs()
top_features = corr_with_target.sort_values(ascending=False).head(20).index.tolist()

# Plot correlation matrix of these top features
plt.figure(figsize=(14, 12))
correlation_matrix = df_temp[top_features].corr()
sns.heatmap(correlation_matrix, annot=True, fmt=".2f", cmap="coolwarm", center=0,
            square=True, linewidths=0.5)
plt.title("Correlation Heatmap — Top 20 Features (by correlation with attack label)")
plt.tight_layout()
plt.savefig("../reports/correlation_heatmap.png", dpi=150, bbox_inches="tight")
plt.show()
print("📁 Saved → reports/correlation_heatmap.png")
```

**Why?**
- **Correlation** tells us how strongly two things are related (1 = perfectly related, 0 = no relationship).
- Features highly correlated with attacks are the ones our model will rely on.
- If two features are highly correlated *with each other* (like 0.99), one is redundant.

---

### Cell 14 — Feature Distributions (Box Plots)

```python
# Box plots for the top 10 most important features
top10 = top_features[:10]

fig, axes = plt.subplots(2, 5, figsize=(24, 10))
axes = axes.flatten()

for i, col in enumerate(top10):
    df_temp.boxplot(column=col, by="Label_Binary", ax=axes[i])
    axes[i].set_title(col, fontsize=10)
    axes[i].set_xlabel("")

plt.suptitle("Top 10 Features — BENIGN (0) vs ATTACK (1)", fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig("../reports/feature_boxplots.png", dpi=150, bbox_inches="tight")
plt.show()
```

**Why?**
- Box plots show us if a feature looks *different* for attacks vs normal traffic.
- If BENIGN and ATTACK boxes don't overlap → great feature for our model!
- If they overlap completely → that feature isn't useful for classification.

---

### Cell 15 — EDA Summary

```python
print("=" * 60)
print("📊 EDA SUMMARY")
print("=" * 60)
print(f"  Total rows:           {df.shape[0]:,}")
print(f"  Total columns:        {df.shape[1]}")
print(f"  Missing values:       {df.isnull().sum().sum():,}")
print(f"  Infinity values:      {np.isinf(df[numeric_cols]).sum().sum():,}")
print(f"  Duplicate rows:       {dup_count:,}")
print(f"  Attack types:         {label_counts.shape[0]}")
print(f"  BENIGN ratio:         {label_counts.get('BENIGN', 0) / len(df) * 100:.1f}%")
print("=" * 60)
print("\n🔧 Issues to fix in Data Cleaning:")
print("  1. Replace infinity values → NaN → median")
print("  2. Remove duplicate rows")
print("  3. Drop identifier columns (IPs, Flow ID, Timestamp)")
print("  4. Encode labels to binary (0/1)")
print("  5. Scale features (StandardScaler)")
print("  6. Handle class imbalance (SMOTE)")
```

**Why?** We summarize everything we found so we have a clear list of problems to fix in the next notebook.

---

---

# 📓 Notebook 2 — `02_data_cleaning.ipynb`

**Goal:** Fix every problem found in EDA and prepare the data for model training.

> [!NOTE]
> **The pipeline:** Raw dirty data → Clean → Encode labels → Split into train/test → Scale numbers → Balance classes → Save

---

### Cell 1 — Imports + Config Setup

```python
import sys
sys.path.insert(0, "..")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import joblib
import json
import warnings

warnings.filterwarnings("ignore")

# Paths
RAW_DIR = Path("../data/raw")
PROCESSED_DIR = Path("../data/processed")
ARTIFACTS_DIR = Path("../artifacts")

# Create output folders if they don't exist
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# Constants
COLUMNS_TO_DROP = ["Flow ID", "Source IP", "Src IP", "Destination IP", "Dst IP", "Timestamp"]
LABEL_COLUMN = "Label"
BENIGN_LABEL = "BENIGN"
TEST_SIZE = 0.20
RANDOM_STATE = 42

print("✅ Setup complete")
```

**Why?**
- `sys.path.insert(0, "..")` — lets us import from the `ml/` parent folder.
- `sklearn` — scikit-learn, the main ML library. We use it for splitting data and scaling.
- `imblearn` — provides SMOTE (a technique to balance uneven classes).
- `joblib` — saves Python objects (like the scaler) to disk so we can reuse them.
- `RANDOM_STATE = 42` — makes results reproducible. Every "random" operation uses this seed, so running the notebook twice gives the same result.

---

### Cell 2 — Load Raw Data

```python
csv_files = sorted(RAW_DIR.glob("*.csv"))
print(f"Loading {len(csv_files)} files...")

dfs = []
for f in csv_files:
    temp = pd.read_csv(f, encoding="utf-8", low_memory=False)
    print(f"  {f.name}: {temp.shape[0]:,} rows")
    dfs.append(temp)

df = pd.concat(dfs, ignore_index=True)
df.columns = df.columns.str.strip()

print(f"\n📊 Total: {df.shape[0]:,} rows × {df.shape[1]} columns")
```

**Why?** Same as EDA — we load and combine all CSVs, stripping column name whitespace.

---

### Cell 3 — Step 1: Drop Identifier Columns

```python
print("BEFORE:", df.shape)

# Only drop columns that actually exist (defensive programming)
cols_to_drop = [c for c in COLUMNS_TO_DROP if c in df.columns]
df = df.drop(columns=cols_to_drop)

print(f"AFTER:  {df.shape}  (dropped {len(cols_to_drop)} columns: {cols_to_drop})")
```

**Why?**
- **Flow ID** — a random unique ID for each network flow. It has no pattern — it's like a row number.
- **Source IP / Destination IP** — specific IP addresses. If we keep these, the model "memorizes" which IPs are attacks instead of learning the *behavior*. It won't work on new IPs.
- **Timestamp** — the date/time the flow was captured. Attacks aren't time-dependent in our scenario.
- These columns are **identifiers**, not **features**. They'd hurt model performance.

---

### Cell 4 — Step 2: Fix Infinity and Missing Values

```python
print("Issues BEFORE cleaning:")
numeric_cols = df.select_dtypes(include=[np.number]).columns
inf_count = np.isinf(df[numeric_cols]).sum().sum()
nan_count = df.isnull().sum().sum()
print(f"  Infinity values: {inf_count:,}")
print(f"  Missing (NaN):   {nan_count:,}")

# Replace infinity with NaN
df.replace([np.inf, -np.inf], np.nan, inplace=True)

# Fill NaN with column median
# WHY median? Because mean is sensitive to outliers.
# If a column has values [1, 2, 3, 1000], mean = 251.5 (misleading), median = 2.5 (realistic)
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

print("\nIssues AFTER cleaning:")
print(f"  Infinity values: {np.isinf(df[numeric_cols]).sum().sum()}")
print(f"  Missing (NaN):   {df.isnull().sum().sum()}")
print("✅ All clean!")
```

**Why?**
- `inf` → `NaN` first, then fill all `NaN` with the **median** of each column.
- **Why median, not mean?** Network data has extreme outliers. A single huge packet can make the average meaningless. Median is the "middle value" and ignores outliers.
- Example: `Flow Bytes/s` might be `[100, 200, 150, 50000000]` → mean is 12.5 million (nonsense), median is 175 (realistic).

---

### Cell 5 — Step 3: Remove Duplicate Rows

```python
before = len(df)
df = df.drop_duplicates()
after = len(df)
removed = before - after

print(f"Rows before: {before:,}")
print(f"Rows after:  {after:,}")
print(f"Removed:     {removed:,} duplicate rows ({removed/before*100:.1f}%)")
```

**Why?**
- Duplicate rows make the model see the same data multiple times.
- This is like studying for an exam using the same flashcard 1000 times — you memorize *that* card but don't learn the subject.
- This is called **overfitting** — the model works great on training data but terribly on new data.

---

### Cell 6 — Step 4: Encode Labels (Text → Numbers)

```python
# See what labels we have
print("Original labels:")
print(df[LABEL_COLUMN].value_counts())

# Store the original attack types before converting
attack_types = df[df[LABEL_COLUMN] != BENIGN_LABEL][LABEL_COLUMN].unique().tolist()
print(f"\nAttack types found: {attack_types}")

# Binary encoding: BENIGN=0, everything else=1
label_mapping = {BENIGN_LABEL: 0}  # BENIGN → 0
for attack in attack_types:
    label_mapping[attack] = 1     # All attacks → 1

df[LABEL_COLUMN] = df[LABEL_COLUMN].map(label_mapping)

print(f"\nAfter encoding:")
print(df[LABEL_COLUMN].value_counts())
print(f"\nLabel mapping: {label_mapping}")
```

**Why?**
- ML models only understand numbers, not text like "BENIGN" or "FTP-Patator".
- We convert to **binary**: `0` = normal traffic, `1` = attack.
- We save the `label_mapping` dict so we can convert predictions back to text later.

---

### Cell 7 — Step 5: Train/Test Split

```python
# Separate features (X) from the target label (y)
X = df.drop(columns=[LABEL_COLUMN])
y = df[LABEL_COLUMN]

print(f"Features (X): {X.shape}  →  {X.shape[1]} features, {X.shape[0]:,} samples")
print(f"Labels   (y): {y.shape}")

# Split: 80% train, 20% test
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,        # 20% for testing
    random_state=RANDOM_STATE,  # reproducible
    stratify=y                  # IMPORTANT! keep same attack ratio in both sets
)

print(f"\n📦 Train: {X_train.shape[0]:,} rows ({X_train.shape[0]/len(X)*100:.0f}%)")
print(f"📦 Test:  {X_test.shape[0]:,} rows ({X_test.shape[0]/len(X)*100:.0f}%)")
print(f"\nTrain label distribution:")
print(y_train.value_counts(normalize=True).round(3))
print(f"\nTest label distribution:")
print(y_test.value_counts(normalize=True).round(3))
```

**Why?**
- You **never** test a model on data it was trained on. That's like giving a student the exam answers and then testing them on the same exam — you learn nothing.
- 80/20 is a standard split.
- `stratify=y` ensures both train and test have the **same proportion** of attacks. Without this, you might randomly get 95% BENIGN in train and 50% in test, making results unreliable.

---

### Cell 8 — Step 6: Feature Scaling (StandardScaler)

```python
scaler = StandardScaler()

# Fit on TRAIN only, then transform both
# WHY? Imagine the test set has a max value of 9999. If we fit on the test data,
# the scaler "knows" about 9999 — but in the real world, we wouldn't!
X_train_scaled = pd.DataFrame(
    scaler.fit_transform(X_train),
    columns=X_train.columns,
    index=X_train.index
)
X_test_scaled = pd.DataFrame(
    scaler.transform(X_test),         # transform only, no fit!
    columns=X_test.columns,
    index=X_test.index
)

print("Before scaling (first row):")
print(X_train.iloc[0, :5].round(2).to_dict())
print("\nAfter scaling (first row):")
print(X_train_scaled.iloc[0, :5].round(2).to_dict())
print("\n✅ Features scaled — mean ≈ 0, std ≈ 1")
```

**Why?**
- Features have wildly different ranges. `Flow Duration` might be 0–1 billion, while `Total Fwd Packets` is 0–100.
- Without scaling, the model thinks `Flow Duration` is more important simply because its numbers are bigger.
- **StandardScaler** transforms each feature so it has mean=0 and standard deviation=1.
- **CRITICAL:** We `fit` (learn the mean/std) ONLY on training data. If we fit on test data too, we'd have **data leakage** — the model indirectly "sees" test data during preprocessing.

---

### Cell 9 — Step 7: SMOTE (Fix Class Imbalance)

```python
print(f"BEFORE SMOTE:")
print(f"  Class 0 (BENIGN): {(y_train == 0).sum():,}")
print(f"  Class 1 (ATTACK): {(y_train == 1).sum():,}")
print(f"  Ratio: 1:{(y_train == 0).sum() / max((y_train == 1).sum(), 1):.1f}")

smote = SMOTE(random_state=RANDOM_STATE)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)

print(f"\nAFTER SMOTE:")
print(f"  Class 0 (BENIGN): {(y_train_resampled == 0).sum():,}")
print(f"  Class 1 (ATTACK): {(y_train_resampled == 1).sum():,}")
print(f"  Ratio: 1:{(y_train_resampled == 0).sum() / max((y_train_resampled == 1).sum(), 1):.1f}")
print(f"\n✅ Classes balanced! ({len(X_train_resampled):,} total samples)")
```

**Why?**
- If BENIGN is 83% and ATTACK is 17%, a lazy model can just always guess "BENIGN" and get 83% accuracy. Sounds great, but it misses every attack!
- **SMOTE (Synthetic Minority Oversampling Technique)** creates *new, synthetic* attack samples by interpolating between existing ones. It doesn't just copy — it creates new points between existing attack data points.
- After SMOTE, both classes have equal samples, so the model must learn the *real* difference.
- **SMOTE is only applied to TRAINING data!** Never the test set. The test set must reflect real-world proportions.

---

### Cell 10 — Step 8: Save Everything

```python
# 1. Save processed data as Parquet (fast, compact format)
X_train_resampled.to_parquet(PROCESSED_DIR / "X_train.parquet")
X_test_scaled.to_parquet(PROCESSED_DIR / "X_test.parquet")
y_train_resampled.to_frame("Label").to_parquet(PROCESSED_DIR / "y_train.parquet")
y_test.to_frame("Label").to_parquet(PROCESSED_DIR / "y_test.parquet")
print("💾 Saved processed data → data/processed/")

# 2. Save the scaler (needed to scale new data at prediction time)
joblib.dump(scaler, ARTIFACTS_DIR / "scaler.joblib")
print("💾 Saved scaler → artifacts/scaler.joblib")

# 3. Save label mapping
with open(ARTIFACTS_DIR / "label_mapping.json", "w") as f:
    json.dump(label_mapping, f, indent=2)
print("💾 Saved label mapping → artifacts/label_mapping.json")

# 4. Save feature names (the model needs to know which columns to expect)
feature_names = list(X_test_scaled.columns)
with open(ARTIFACTS_DIR / "feature_names.json", "w") as f:
    json.dump(feature_names, f, indent=2)
print(f"💾 Saved {len(feature_names)} feature names → artifacts/feature_names.json")

# 5. Save metadata
metadata = {
    "train_shape": list(X_train_resampled.shape),
    "test_shape": list(X_test_scaled.shape),
    "smote_applied": True,
    "original_train_size": len(X_train),
    "test_size": TEST_SIZE,
    "random_state": RANDOM_STATE,
}
with open(ARTIFACTS_DIR / "preprocessing_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print("💾 Saved metadata → artifacts/preprocessing_metadata.json")

print("\n✅ DATA CLEANING COMPLETE!")
```

**Why?**
- **Parquet** instead of CSV — 3x smaller files, 5x faster to read. It also preserves data types exactly.
- **Save the scaler** — when a user uploads new data to the web app, we need to scale it the *exact same way* we scaled training data.
- **Save feature names** — the model expects columns in a specific order. If the user's CSV has columns in a different order, we rearrange them using this list.
- **Save metadata** — documents what we did so future-you (or teammates) know the settings.

---

---

# 📓 Notebook 3 — `03_model_training.ipynb`

**Goal:** Train 3 different ML models, compare them, pick the best one, and save it.

> [!NOTE]
> We train 3 models because no single algorithm is always best. We benchmark them and pick the winner.

---

### Cell 1 — Imports

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import joblib
import time
import warnings

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
)
from sklearn.model_selection import RandomizedSearchCV
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
sns.set_theme(style="darkgrid")

# Paths
PROCESSED_DIR = Path("../data/processed")
ARTIFACTS_DIR = Path("../artifacts")
REPORTS_DIR = Path("../reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42

print("✅ Libraries loaded")
```

**Why?**
- `LogisticRegression` — a simple, fast model. Our **baseline**. If fancy models can't beat this, something is wrong.
- `RandomForestClassifier` — creates hundreds of simple decision trees and takes their vote. Very good for tabular data.
- `XGBClassifier` — XGBoost, a powerful gradient boosting algorithm. Often wins ML competitions.
- `RandomizedSearchCV` — tries random combinations of hyperparameters with cross-validation.
- We import many metrics because accuracy alone is misleading with imbalanced data.

---

### Cell 2 — Load Processed Data

```python
X_train = pd.read_parquet(PROCESSED_DIR / "X_train.parquet")
X_test = pd.read_parquet(PROCESSED_DIR / "X_test.parquet")
y_train = pd.read_parquet(PROCESSED_DIR / "y_train.parquet")["Label"]
y_test = pd.read_parquet(PROCESSED_DIR / "y_test.parquet")["Label"]

print(f"Train: {X_train.shape[0]:,} rows × {X_train.shape[1]} features")
print(f"Test:  {X_test.shape[0]:,} rows × {X_test.shape[1]} features")
print(f"\nTrain labels: {y_train.value_counts().to_dict()}")
print(f"Test labels:  {y_test.value_counts().to_dict()}")
```

**Why?** We load the *cleaned, scaled, balanced* data that Notebook 2 saved. We never touch raw data in the training notebook.

---

### Cell 3 — Define Models and Hyperparameters

```python
# Each model gets a dict of hyperparameters to try
models = {
    "LogisticRegression": {
        "model": LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        "params": {
            "C": [0.01, 0.1, 1.0, 10.0],    # regularization strength
        },
    },
    "RandomForest": {
        "model": RandomForestClassifier(random_state=RANDOM_STATE),
        "params": {
            "n_estimators": [100, 200],       # number of trees
            "max_depth": [10, 20, None],      # how deep each tree grows
            "min_samples_split": [2, 5],      # minimum data to split a node
        },
    },
    "XGBoost": {
        "model": XGBClassifier(
            random_state=RANDOM_STATE,
            eval_metric="logloss",
            use_label_encoder=False,
        ),
        "params": {
            "n_estimators": [100, 200],
            "max_depth": [3, 6, 10],
            "learning_rate": [0.01, 0.1, 0.3],
        },
    },
}

print(f"📦 {len(models)} models configured:")
for name in models:
    print(f"  • {name}")
```

**Why?**
- **Hyperparameters** are model settings YOU choose (unlike model weights, which are learned from data).
- `C` in Logistic Regression = how much we penalize complexity. Low C → simpler model.
- `n_estimators` = number of trees. More trees → better accuracy, but slower.
- `max_depth` = how deep trees grow. Deeper trees can learn complex patterns but may overfit.
- `learning_rate` (XGBoost) = how fast the model learns. Lower → slower but more accurate.
- We'll try different combinations to find the best.

---

### Cell 4 — Train All Models with Hyperparameter Tuning

```python
results = {}

for name, config in models.items():
    print(f"\n{'='*60}")
    print(f"🏋️ Training: {name}")
    print(f"{'='*60}")

    start = time.time()

    # RandomizedSearchCV tries random combinations of params
    search = RandomizedSearchCV(
        estimator=config["model"],
        param_distributions=config["params"],
        n_iter=10,              # try 10 random combinations
        cv=5,                   # 5-fold cross-validation
        scoring="f1",           # optimize for F1 score (not accuracy!)
        random_state=RANDOM_STATE,
        n_jobs=-1,              # use all CPU cores
        verbose=1,
    )

    search.fit(X_train, y_train)
    duration = time.time() - start

    # Get the best model from the search
    best_model = search.best_estimator_

    # Predict on test set
    y_pred = best_model.predict(X_test)
    y_proba = best_model.predict_proba(X_test)[:, 1]  # probability of being attack

    # Calculate all metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_proba),
    }

    results[name] = {
        "model": best_model,
        "best_params": search.best_params_,
        "metrics": metrics,
        "y_pred": y_pred,
        "y_proba": y_proba,
        "training_time": duration,
    }

    print(f"\n⏱️  Time: {duration:.1f}s")
    print(f"🎯 Best params: {search.best_params_}")
    print(f"📊 Results on TEST set:")
    for metric, value in metrics.items():
        print(f"   {metric:>12}: {value:.4f}")
```

**Why?**
- **RandomizedSearchCV** randomly picks 10 combinations of hyperparameters and tests each with **5-fold cross-validation**:
  - Split training data into 5 parts
  - Train on 4 parts, validate on the 5th
  - Repeat 5 times, rotating which part is validation
  - Average the scores → reliable estimate of model quality
- We optimize for **F1 score**, not accuracy. F1 balances precision and recall — both matter for intrusion detection.
- `n_jobs=-1` uses all your CPU cores for faster training.
- We save predictions and probabilities for each model so we can make comparison charts.

---

### Cell 5 — Compare Models Side-by-Side

```python
# Create a comparison table
comparison = pd.DataFrame({
    name: res["metrics"] for name, res in results.items()
}).T.round(4)

comparison["training_time_s"] = [results[n]["training_time"] for n in comparison.index]

print("📊 Model Comparison:")
print(comparison.to_string())

# Bar chart comparison
fig, ax = plt.subplots(figsize=(12, 6))
comparison[["accuracy", "precision", "recall", "f1_score", "roc_auc"]].plot(
    kind="bar", ax=ax, edgecolor="black", width=0.8
)
ax.set_title("Model Comparison — All Metrics", fontsize=14)
ax.set_ylabel("Score")
ax.set_ylim(0.85, 1.0)  # zoom in since all scores are high
ax.set_xticklabels(ax.get_xticklabels(), rotation=0)
ax.legend(loc="lower right")
plt.tight_layout()
plt.savefig(REPORTS_DIR / "model_comparison.png", dpi=150, bbox_inches="tight")
plt.show()
print("📁 Saved → reports/model_comparison.png")
```

**Why?** We want to compare all models in one plot. This makes it easy to see which model wins on each metric.

---

### Cell 6 — Select the Best Model

```python
# Pick the model with the highest F1 score (our primary metric)
best_name = max(results, key=lambda n: results[n]["metrics"]["f1_score"])
best_result = results[best_name]

print(f"🏆 BEST MODEL: {best_name}")
print(f"   F1 Score:  {best_result['metrics']['f1_score']:.4f}")
print(f"   ROC-AUC:   {best_result['metrics']['roc_auc']:.4f}")
print(f"   Accuracy:  {best_result['metrics']['accuracy']:.4f}")
print(f"   Params:    {best_result['best_params']}")
```

**Why?** We pick the winner based on **F1 score** — the metric that best balances catching all attacks (recall) and not raising false alarms (precision).

---

### Cell 7 — Confusion Matrix

```python
y_pred_best = best_result["y_pred"]
cm = confusion_matrix(y_test, y_pred_best)

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt=",d", cmap="Blues",
            xticklabels=["BENIGN (0)", "ATTACK (1)"],
            yticklabels=["BENIGN (0)", "ATTACK (1)"])
plt.title(f"Confusion Matrix — {best_name}")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig(REPORTS_DIR / "confusion_matrix.png", dpi=150, bbox_inches="tight")
plt.show()

# Explain the matrix
tn, fp, fn, tp = cm.ravel()
print(f"True Negatives  (correctly said BENIGN):  {tn:,}")
print(f"False Positives (said ATTACK, was BENIGN): {fp:,}  ← false alarms")
print(f"False Negatives (said BENIGN, was ATTACK): {fn:,}  ← MISSED ATTACKS! ⚠️")
print(f"True Positives  (correctly said ATTACK):   {tp:,}")
```

**Why?**
- Accuracy alone doesn't tell the full story. The confusion matrix shows *where* the model makes mistakes.
- **False Negatives are dangerous** — the model says "normal" but it's actually an attack. Missed intrusions!
- **False Positives are annoying** — the model raises a false alarm. The security team investigates nothing.
- We want FN to be as low as possible (high recall).

---

### Cell 8 — ROC Curve

```python
y_proba_best = best_result["y_proba"]
fpr, tpr, thresholds = roc_curve(y_test, y_proba_best)
roc_auc = best_result["metrics"]["roc_auc"]

plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color="#3b82f6", linewidth=2, label=f"{best_name} (AUC = {roc_auc:.4f})")
plt.plot([0, 1], [0, 1], "k--", linewidth=1, label="Random Guess (AUC = 0.5)")
plt.fill_between(fpr, tpr, alpha=0.1, color="#3b82f6")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title(f"ROC Curve — {best_name}")
plt.legend(loc="lower right")
plt.tight_layout()
plt.savefig(REPORTS_DIR / "roc_curve.png", dpi=150, bbox_inches="tight")
plt.show()
```

**Why?**
- The **ROC curve** shows the tradeoff between catching attacks (True Positive Rate) and false alarms (False Positive Rate).
- The **AUC (Area Under Curve)** summarizes this: 1.0 = perfect, 0.5 = random guessing.
- A curve hugging the top-left corner = excellent model.

---

### Cell 9 — Precision-Recall Curve

```python
precision_vals, recall_vals, pr_thresholds = precision_recall_curve(y_test, y_proba_best)

plt.figure(figsize=(8, 6))
plt.plot(recall_vals, precision_vals, color="#10b981", linewidth=2)
plt.fill_between(recall_vals, precision_vals, alpha=0.1, color="#10b981")
plt.xlabel("Recall (% of attacks caught)")
plt.ylabel("Precision (% of attack alerts that are real)")
plt.title(f"Precision-Recall Curve — {best_name}")
plt.tight_layout()
plt.savefig(REPORTS_DIR / "precision_recall_curve.png", dpi=150, bbox_inches="tight")
plt.show()
```

**Why?**
- More useful than ROC when classes are imbalanced (which ours are before SMOTE in test set).
- Shows: "If I catch 95% of attacks, what % of my alerts are real?" This is what a security team actually cares about.

---

### Cell 10 — Feature Importance

```python
# Get feature importance (works for tree-based models)
best_model = best_result["model"]

if hasattr(best_model, "feature_importances_"):
    importances = pd.Series(
        best_model.feature_importances_,
        index=X_train.columns
    ).sort_values(ascending=False)

    # Plot top 15
    plt.figure(figsize=(10, 8))
    importances.head(15).plot(kind="barh", color="#3b82f6", edgecolor="black")
    plt.title(f"Top 15 Feature Importances — {best_name}")
    plt.xlabel("Importance Score")
    plt.gca().invert_yaxis()
    plt.tight_layout()
    plt.savefig(REPORTS_DIR / "feature_importance.png", dpi=150, bbox_inches="tight")
    plt.show()

    print("Top 10 most important features:")
    for i, (feat, imp) in enumerate(importances.head(10).items(), 1):
        print(f"  {i:>2}. {feat:<35} {imp:.4f}")
else:
    print("⚠️ Feature importances not available for this model type")
```

**Why?**
- Shows which network traffic features matter most for detecting attacks.
- Useful for: explaining the model to others, reducing features (removing unimportant ones), understanding attack patterns.
- Example: if "Bwd Packet Length Max" is #1 → attacks send large backward packets.

---

### Cell 11 — Full Classification Report

```python
print(f"\n📋 Classification Report — {best_name}")
print("=" * 60)
print(classification_report(y_test, y_pred_best, target_names=["BENIGN", "ATTACK"]))
```

**Why?** This gives a clean summary table of precision, recall, and F1 per class. Good for your project report.

---

### Cell 12 — Save the Best Model + Metrics

```python
from datetime import datetime, timezone

# 1. Save the trained model
model_path = ARTIFACTS_DIR / "best_model.joblib"
joblib.dump(best_model, model_path)
print(f"💾 Model saved → {model_path}")

# 2. Save evaluation metrics as JSON
evaluation = {
    "model_name": best_name,
    "model_version": "0.1.0",
    "dataset": "CICIDS2017",
    "best_params": best_result["best_params"],
    "metrics": best_result["metrics"],
    "confusion_matrix": {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    },
    "training_time_seconds": round(best_result["training_time"], 2),
    "training_date": datetime.now(timezone.utc).isoformat(),
    "feature_count": X_train.shape[1],
    "train_samples": X_train.shape[0],
    "test_samples": X_test.shape[0],
}

metrics_path = REPORTS_DIR / "evaluation_metrics.json"
with open(metrics_path, "w") as f:
    json.dump(evaluation, f, indent=2)
print(f"💾 Metrics saved → {metrics_path}")

# 3. Save all models comparison
all_models_metrics = {
    name: results[name]["metrics"] for name in results
}
with open(REPORTS_DIR / "all_models_comparison.json", "w") as f:
    json.dump(all_models_metrics, f, indent=2, default=str)
print(f"💾 All models comparison saved → reports/all_models_comparison.json")

print("\n" + "=" * 60)
print("🎉 MODEL TRAINING COMPLETE!")
print("=" * 60)
print(f"\nBest model:  {best_name}")
print(f"F1 Score:    {best_result['metrics']['f1_score']:.4f}")
print(f"ROC-AUC:     {best_result['metrics']['roc_auc']:.4f}")
print(f"\nArtifacts saved to: {ARTIFACTS_DIR}")
print(f"Reports saved to:   {REPORTS_DIR}")
```

**Why?**
- `best_model.joblib` — this is the file the web app's backend loads to make predictions on uploaded CSVs.
- `evaluation_metrics.json` — the backend's `/api/v1/metrics` endpoint reads this file to show model performance on the dashboard.
- We save everything needed to deploy and explain the model.

---

---

# 📋 Quick Reference — What Goes Where

| What | File | Created By |
|------|------|-----------|
| Raw CSVs | `data/raw/*.csv` | You download |
| Cleaned data | `data/processed/*.parquet` | Notebook 02 |
| Trained model | `artifacts/best_model.joblib` | Notebook 03 |
| Scaler | `artifacts/scaler.joblib` | Notebook 02 |
| Label mapping | `artifacts/label_mapping.json` | Notebook 02 |
| Feature names | `artifacts/feature_names.json` | Notebook 02 |
| Metrics JSON | `reports/evaluation_metrics.json` | Notebook 03 |
| All plots | `reports/*.png` | Notebooks 01 & 03 |

---

# 🔄 Order of Execution

```
1. Download CICIDS2017 CSVs → ml/data/raw/
2. Run 01_eda.ipynb          → understand data problems
3. Run 02_data_cleaning.ipynb → fix problems, save cleaned data
4. Run 03_model_training.ipynb → train models, save best one
5. Backend loads best_model.joblib + scaler.joblib → ready for predictions!
```
