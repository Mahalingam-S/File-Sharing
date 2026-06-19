# Implementation Plan - Backend Refinements and Master Admin Migration

This plan details the implementation of backend enhancements, bug fixes, utility script improvements, and migration of the Master Admin email address to match the domain restrictions of the platform.

## User Review Required

> [!IMPORTANT]
> The Master Admin email is being migrated from `s_mahalingam@cb.amrita.edu` to `s_mahalingam@gmail.com`. This is highly beneficial because the current registration flow strictly restricts user domains to `@gmail.com`, which would have locked out the previous university domain address during public signup checks.

## Proposed Changes

We will modify backend utility scripts, controllers, and configuration files to eliminate hardcoded values, fix typos, implement dynamic CLI features, and perform the master admin email migration.

---

### Backend Utilities & Scripts

#### [MODIFY] [wipe-and-seed.js](file:///d:/File-Sharing/backend/wipe-and-seed.js)
- Load `dotenv` and use `process.env.MONGO_URI` with a local fallback.
- Change the seeded Master Admin email from `s_mahalingam@cb.amrita.edu` to `s_mahalingam@gmail.com`.

#### [MODIFY] [make-admin.js](file:///d:/File-Sharing/backend/make-admin.js)
- Load `dotenv` and use `process.env.MONGO_URI` with a local fallback.
- Parse standard CLI argument `--email=user@domain.edu` dynamically as documented in `project_documentation.md`.
- Fix the `'gamil.com'` typos to `'gmail.com'` for fallback test accounts.

#### [MODIFY] [demote-admins.js](file:///d:/File-Sharing/backend/demote-admins.js)
- Load `dotenv` and use `process.env.MONGO_URI` with a local fallback.
- Fix the `'gamil.com'` typos to `'gmail.com'` for test accounts.

#### [MODIFY] [reset-pass.js](file:///d:/File-Sharing/backend/reset-pass.js)
- Load `dotenv` and use `process.env.MONGO_URI` with a local fallback.
- Change Target User query from `s_mahalingam@cb.amrita.edu` to `s_mahalingam@gmail.com`.

#### [MODIFY] [test-folders.js](file:///d:/File-Sharing/backend/test-folders.js)
- Load `dotenv` and use `process.env.MONGO_URI` and `process.env.JWT_SECRET` with local fallbacks.
- Update target admin query from `s_mahalingam@cb.amrita.edu` to `s_mahalingam@gmail.com`.

#### [MODIFY] [test-upload.js](file:///d:/File-Sharing/backend/test-upload.js)
- Load `dotenv` and use `process.env.MONGO_URI` and `process.env.JWT_SECRET` with local fallbacks.

#### [MODIFY] [test-admin-db.js](file:///d:/File-Sharing/backend/test-admin-db.js)
- Load `dotenv` and use `process.env.MONGO_URI` with local fallback.

---

### Core Backend & Configuration

#### [MODIFY] [authController.js](file:///d:/File-Sharing/backend/controllers/authController.js)
- Update auto-promotion domain conditions on lines 59 and 194 to look for `s_mahalingam@gmail.com` as the exclusive master admin account.

#### [MODIFY] [package.json](file:///d:/File-Sharing/backend/package.json)
- Add standard dev script command `"dev": "nodemon server.js"` under the `"scripts"` block to align with developer guides.

---

## Verification Plan

### Automated Tests
- Run `node check_users.js` to ensure script connectivity to the database.
- Run `node wipe-and-seed.js` to clear database and seed the new `s_mahalingam@gmail.com` admin user.
- Run `node make-admin.js --email=test_user@gmail.com` to test command-line promotion parsing.
- Run `node check_users.js` again to verify successful promotions.
