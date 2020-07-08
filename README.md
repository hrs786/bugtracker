# BugTracker
[Deployed app at heroku](https://successtracker.herokuapp.com/)  
This is an issue tracking web-app for projects

## Tech/Frameworks used
- express
- mysqljs
- pug
- auth0 authentication api

## Features
### Roles of users
- Anyone with account can create issue in any project and view details of projects/issues (general user)
- Member who is assigned issue can edit issue but can't change the person whom the issue is assigned to + abilities of general user (user assigned issue)
- Head of project can edit(can change who is assigned issue) and delete any issue of project + abilities of user assigned issue (Head)
- Admin can create/edit/delete project, add members to project + abilities of Head (Admin)
### Data maintained
- Project and issue related data
- Projects of which logged in user is a member, issues assigned to user are explicitly visible
- Members of projects
- Progress chart for projects
- Repository address for projects
- Secure authentication with auth0
- Change password, name
### Constraints
- Head of project can't be NULL, so Head can't be deleted(to delete head -> update head to other member, delete last Head which has turned a member)
- Head is automatically added as member of project
- Only members of projects can be assigned issue

## Running the app
- Clone repository
- Install dependencies as in package.json
- Follow code/instructions in "database" directory to set up database
- Create .env file corresponding to .env.example file (instructions inside .env.example file)
- Default port set is 8080, if it is not free set other port
- Use command `node index.js` to run app

## TODOs
- Commenting in issues
- Filter issues by category
<!--
update issue file, dashboard table len limit, project file, delete user account, loader, delete project completely
-->
