"""
IntrusionIQ — Project Structure Checker
Run this from your IntrusionIQ/ root folder:
    python check_structure.py
"""

import os

GREEN = "\033[92m"
RED   = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

REQUIRED = [
    # ── Backend core ──────────────────────────────────────────
    "backend/requirements.txt",
    "backend/Dockerfile",
    "backend/app/__init__.py",
    "backend/app/main.py",

    # API layer
    "backend/app/api/__init__.py",
    "backend/app/api/v1/__init__.py",
    "backend/app/api/v1/routes/__init__.py",
    "backend/app/api/v1/routes/health.py",
    "backend/app/api/v1/routes/metrics.py",
    "backend/app/api/v1/routes/predict.py",

    # Core (config + model loader)
    "backend/app/core/__init__.py",
    "backend/app/core/config.py",
    "backend/app/core/ml_loader.py",

    # Schemas
    "backend/app/schemas/__init__.py",
    "backend/app/schemas/prediction.py",

    # Tests
    "backend/tests/__init__.py",
    "backend/tests/test_predict.py",

    # ── Backend runtime folders (need to exist, can be empty) ──
    "backend/models/",          # voting_ensemble.pkl goes here
    "backend/artifacts/",       # scaler.pkl + feature_names.json go here

    # ── ML outputs (downloaded from Kaggle) ───────────────────
    "ml/models/",
    "ml/artifacts/",
    "ml/plots/",

    # ── Frontend ──────────────────────────────────────────────
    "frontend/Dockerfile",
    "frontend/package.json",
    "frontend/src/App.jsx",
    "frontend/src/pages/Dashboard.jsx",
    "frontend/src/services/api.js",

    # ── Root ──────────────────────────────────────────────────
    ".gitignore",
    "docker-compose.yml",
    "README.md",
]

# Files that should NOT exist
SHOULD_NOT_EXIST = [
    "main.py",           # root-level main.py is wrong
    "ml/config.py",
    "ml/requirements.txt",
    "ml/src/",
    "ml/data/",
    "ml/notebooks/",
    "ml/reports/",
]

def check():
    print("\n── IntrusionIQ Structure Check ──────────────────────\n")

    passed = 0
    failed = 0
    warnings = 0

    for path in REQUIRED:
        is_dir = path.endswith("/")
        exists = os.path.isdir(path) if is_dir else os.path.isfile(path)
        label  = "DIR " if is_dir else "FILE"

        if exists:
            print(f"  {GREEN}✔{RESET}  [{label}]  {path}")
            passed += 1
        else:
            print(f"  {RED}✘{RESET}  [{label}]  {path}  ← MISSING")
            failed += 1

    print()
    print("── Checking for files that should NOT exist ─────────\n")

    for path in SHOULD_NOT_EXIST:
        is_dir = path.endswith("/")
        exists = os.path.isdir(path) if is_dir else os.path.isfile(path)

        if exists:
            label = "DIR" if is_dir else "FILE"
            print(f"  {YELLOW}⚠{RESET}  [{label}]  {path}  ← DELETE THIS")
            warnings += 1
        else:
            print(f"  {GREEN}✔{RESET}  not present (correct)  {path}")

    print()
    print("─────────────────────────────────────────────────────")
    print(f"  {GREEN}Passed : {passed}{RESET}")
    print(f"  {RED}Missing: {failed}{RESET}")
    print(f"  {YELLOW}Warnings (delete these): {warnings}{RESET}")
    print("─────────────────────────────────────────────────────\n")

    if failed == 0 and warnings == 0:
        print(f"  {GREEN}All good! You're ready to write code.{RESET}\n")
    else:
        print(f"  Fix the issues above, then run this script again.\n")

if __name__ == "__main__":
    check()