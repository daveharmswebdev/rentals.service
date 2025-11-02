# System Patterns: Database Management

## Database Configuration
- Database Type: PostgreSQL 17
- Connection Strategy: To be determined
- ORM Consideration: Potential use of TypeORM or Prisma

## Data Model Patterns
### Homes Table
- Primary Key: Auto-incrementing SERIAL
- Constraint: All fields required
- Potential future extensions:
  - Add timestamps (created_at, updated_at)
  - Add soft delete mechanism
  - Consider indexing for performance

## Naming Conventions
- Database: snake_case (`rentals_db`)
- Tables: plural, snake_case (`homes`)
- Columns: snake_case
