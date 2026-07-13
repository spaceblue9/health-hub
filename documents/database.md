# Database
## Requirement
Database is required for this project.
## Preference
Supabase (PostgreSQL)

## Likely Entities
- **users**: Handled by Supabase Auth (`auth.users`), supplemented by a public `profiles` table for role (admin/user) and limits.
- **patients**: Profiles of family members created by users.
- **timeline_events**: Medical events associated with a patient profile.
- **attachments**: References to files stored in Supabase Storage.
- **share_links**: Records of generated links with expiration dates.