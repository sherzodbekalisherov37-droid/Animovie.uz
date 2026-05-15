# Security Specification

1. **Data Invariants**:
   - Every movie must have a title, image, and genre.
   - User roles can only be set by an existing admin or via a secure backend process (for the first admin). Since I don't have a backend, I will bootstrap the first admin via email ('sherzodbekalisherov37@gmail.com').

2. **The Dirty Dozen Payloads**:
   - Unauthenticated user trying to create a movie.
   - Regular user trying to delete a movie.
   - User trying to change their own role to 'admin'.
   - User trying to update another user's profile.
   - Movie with a 1MB title string.
   - Movie without a required genre field.
   - User profile with missing UID.
   - Malicious user trying to inject script in movie title.
   - Admin trying to set an invalid role.
   - User trying to create a movie with a future timestamp as current.
   - User trying to list all users without admin privileges.
   - Attacker trying to spoof admin by adding 'role: admin' to their public profile update.

3. **Rules Logic**:
   - `isAdmin()` checks if `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`.
   - `movies` collection: `allow read: if true;`, `allow write: if isAdmin();`.
   - `users` collection: `allow read: if isOwner(userId) || isAdmin();`, `allow write: if isOwner(userId) && !incoming().keys().hasAny(['role']);`. 
