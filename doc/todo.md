- Add documents data
- Add documents APIs
- Add documents admin page
    - Manage tags, status
    - Manage documents and versions
- Youtube / Bookmark organizer
- Book list organizer




- log in user:
    - validate
    - session connection with redis
    - log in / log out with session
- frontend and admin area / init page
- email - nodemailer
- password reset
- totp
- user management page - sign up
- captcha


# Features

## Content Types

- Poetry
- Essays
- Academic articles
- Web and desktop games
- Software including Github repos
- Algorithms including demos
- Music, art, literature, film reviews
- Versioned documents
- Complex menu system

## Data Model

- Section
    - Name
    - VisibleName

- Status
    - Name
    - VisibleName

- Document
    - ID
    - Path
    - Section
    - Status
    - Title
    - Created
    - Versions
        - ID
        - Content (Markdown)
        - Title
        - Created
        - Edited

- LinkedFile
    - Title
    - Path
    - Document
    - Content (Blob)
    - Type (image/pdf/folder)

- Have file caching done in express, also in an nginx public folder
    - /files/[...path...]
    - /cached/[...path...]