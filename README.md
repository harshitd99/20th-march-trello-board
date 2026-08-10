# Trello Board Backend

A Trello-like backend built with **Node.js, Express.js, MongoDB, and Mongoose**.

## Features

* User Signup / Signin
* JWT Authentication
* Organization creation
* Organization member management
* Board creation
* Board member management
* Create and view lists
* Create and view cards
* Move cards between lists
* Board-level authorization

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token
* JavaScript

## Structure

```text
User
 │
 ▼
Organization
 │
 ▼
Board
 │
 ▼
List
 │
 ▼
Card
```

## API Routes

### Authentication

```text
POST /signup
POST /signin
```

### Organization

```text
POST   /organization
POST   /add-member-to-organization
GET    /organization
GET    /org-members-inside-org
DELETE /members
```

### Board

```text
POST /board
POST /add-member-to-board
GET  /boards
```

### Lists

```text
POST /create-list
GET  /all-lists-inside-board
```

### Cards

```text
POST /create-card
GET  /all-cards-inside-board-list
PUT  /shift-card-from-one-list-to-another
```

## Setup

Clone the repository:

```bash
git clone git@github.com:harshitd99/20th-march-trello-board.git
cd 20th-march-trello-board
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

Start the server:

```bash
node index.js
```

Server:

```text
http://localhost:3000
```

## Authorization

```text
Organization Admin
        │
        └── Create Board
                │
                ▼
          Board Admin
                │
                └── Add Members
                        │
                        ▼
                   Board Members
                        │
                   ┌────┴────┐
                   ▼         ▼
                Lists      Cards
```

Board members can create lists, create cards, view board data, and move cards between lists.

## Future Improvements

* Password hashing
* Request validation
* Update/Delete operations
* Card assignment
* Comments and labels
* Drag-and-drop ordering
* Role-based permissions
* Docker and deployment
* Automated testing

## License

This project is for learning and development purposes.
