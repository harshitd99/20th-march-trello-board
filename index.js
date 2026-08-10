const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const {
  userModel,
  organizationModel,
  boardModel,
  listModel,
  cardModel,
} = require("./model");

const { authMiddleware } = require("./middleware");

const app = express();

app.use(express.json());

// =====================================================
// CREATE USER
// =====================================================

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = await userModel.findOne({
    username: username,
  });

  if (userExists) {
    return res.status(411).json({
      message: "User with this username already exists",
    });
  }

  const newUser = await userModel.create({
    username: username,
    password: password,
  });

  return res.json({
    id: newUser._id,
    message: "You have signed up successfully",
  });
});

// =====================================================
// SIGN IN
// =====================================================

app.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = await userModel.findOne({
    username: username,
    password: password,
  });

  if (!userExists) {
    return res.status(403).json({
      message: "Incorrect credentials",
    });
  }

  const token = jwt.sign(
    {
      userId: userExists.id,
    },
    "attlasiationsupersecret123123password",
  );

  return res.json({
    token,
  });
});

// =====================================================
// CREATE ORGANIZATION
// =====================================================

app.post("/organization", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const newOrg = await organizationModel.create({
    title: req.body.title,
    description: req.body.description,
    admin: userId,
    members: [],
  });

  return res.json({
    message: "Org created",
    id: newOrg._id,
  });
});

// =====================================================
// ADD MEMBER TO ORGANIZATION
// =====================================================

app.post("/add-member-to-organization", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const organizationId = req.body.organizationId;
  const memberUsername = req.body.memberUserUsername;

  // Find organization

  const organization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check organization admin

  if (organization.admin.toString() !== userId) {
    return res.status(403).json({
      message: "Only organization admin can add members",
    });
  }

  // Find user

  const memberUser = await userModel.findOne({
    username: memberUsername,
  });

  if (!memberUser) {
    return res.status(404).json({
      message: "No user with this username exists in our db",
    });
  }

  // Check duplicate member

  const alreadyMember = organization.members.some(
    (member) => member.toString() === memberUser._id.toString(),
  );

  if (alreadyMember) {
    return res.status(400).json({
      message: "User is already a member of this organization",
    });
  }

  // Add member

  organization.members.push(memberUser._id);

  await organization.save();

  return res.json({
    message: "New member added!",
  });
});

// =====================================================
// CREATE BOARD
// =====================================================

app.post("/board", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const organizationId = req.body.organizationId;

  // Find organization

  const organization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Only organization admin can create board

  if (organization.admin.toString() !== userId) {
    return res.status(403).json({
      message: "Only organization admin can create a board",
    });
  }

  // Create board

  const newBoard = await boardModel.create({
    title: req.body.title,

    description: req.body.description,

    organization: organizationId,

    admin: userId,

    // IMPORTANT
    // Board admin is automatically a board member

    members: [userId],
  });

  return res.json({
    message: "Board created",
    id: newBoard._id,
  });
});

// =====================================================
// ADD MEMBER TO BOARD
// =====================================================

app.post("/add-member-to-board", authMiddleware, async (req, res) => {
  const adminId = req.userId;

  const { boardId, memberUserId } = req.body;

  // Find board

  const board = await boardModel.findById(boardId);

  if (!board) {
    return res.status(404).json({
      message: "Board not found",
    });
  }

  // Check board admin

  if (board.admin.toString() !== adminId) {
    return res.status(403).json({
      message: "Only board admin can add members",
    });
  }

  // Find organization

  const organization = await organizationModel.findById(board.organization);

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check whether target user belongs
  // to organization

  const isOrganizationMember = organization.members.some(
    (member) => member.toString() === memberUserId,
  );

  if (!isOrganizationMember) {
    return res.status(403).json({
      message: "User is not a member of this organization",
    });
  }

  // Check if already board member

  const alreadyBoardMember = board.members.some(
    (member) => member.toString() === memberUserId,
  );

  if (alreadyBoardMember) {
    return res.status(400).json({
      message: "User is already a member of this board",
    });
  }

  // Add member

  board.members.push(memberUserId);

  await board.save();

  return res.status(200).json({
    message: "Member added to board successfully",
  });
});

// =====================================================
// CREATE LIST
// =====================================================

app.post("/create-list", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const { title, boardId } = req.body;

  // Check input

  if (!title || !boardId) {
    return res.status(400).json({
      message: "Title and boardId are required",
    });
  }

  // Find board

  const board = await boardModel.findById(boardId);

  if (!board) {
    return res.status(404).json({
      message: "Board not found",
    });
  }

  // Check board membership

  const isMember = board.members.some((member) => member.toString() === userId);

  if (!isMember) {
    return res.status(403).json({
      message: "You are not a member of this board",
    });
  }

  // Find last list

  const lastList = await listModel
    .findOne({
      board: boardId,
    })
    .sort({
      position: -1,
    });

  // Calculate position

  const position = lastList ? lastList.position + 1 : 0;

  // Create list

  const list = await listModel.create({
    title,

    board: boardId,

    position,
  });

  return res.status(201).json({
    message: "List created successfully",

    list,
  });
});

// =====================================================
// CREATE CARD
// =====================================================

app.post("/create-card", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const { title, description, listId } = req.body;

  // Check input

  if (!title || !listId) {
    return res.status(400).json({
      message: "Title and listId are required",
    });
  }

  // Find list

  const list = await listModel.findById(listId);

  if (!list) {
    return res.status(404).json({
      message: "List not found",
    });
  }

  // Find board

  const board = await boardModel.findById(list.board);

  if (!board) {
    return res.status(404).json({
      message: "Board not found",
    });
  }

  // Check board membership

  const isMember = board.members.some((member) => member.toString() === userId);

  if (!isMember) {
    return res.status(403).json({
      message: "You are not a member of this board",
    });
  }

  // Find last card

  const lastCard = await cardModel
    .findOne({
      list: listId,
    })
    .sort({
      position: -1,
    });

  // Calculate position

  const position = lastCard ? lastCard.position + 1 : 0;

  // Create card

  const card = await cardModel.create({
    title,

    description,

    board: board._id,

    list: list._id,

    position,

    createdBy: userId,
  });

  return res.status(201).json({
    message: "Card created successfully",

    card,
  });
});

// =====================================================
// GET ORGANIZATION
// =====================================================

app.get("/organization", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const organizationId = req.query.organizationId;

  // Find organization

  const organization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check admin

  if (organization.admin.toString() !== userId) {
    return res.status(403).json({
      message: "Only organization admin can access this",
    });
  }

  // Get members

  const members = await userModel.find({
    _id: {
      $in: organization.members,
    },
  });

  return res.json({
    organization: {
      title: organization.title,

      description: organization.description,

      admin: organization.admin,

      members: members.map((member) => ({
        username: member.username,

        id: member._id,
      })),
    },
  });
});

// =====================================================
// GET ALL BOARDS INSIDE ORGANIZATION
// =====================================================

app.get("/boards", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const organizationId = req.query.organizationId;

  // Find organization

  const organization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check organization admin

  if (organization.admin.toString() !== userId) {
    return res.status(403).json({
      message: "Only organization admin can access boards",
    });
  }

  // IMPORTANT:
  // Search using organization field,
  // not _id.

  const orgBoards = await boardModel.find({
    organization: organizationId,
  });

  return res.json({
    orgBoards,
  });
});

// =====================================================
// GET ALL LISTS INSIDE BOARD
// =====================================================

app.get("/all-lists-inside-board", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const { boardId } = req.query;

  // Check input

  if (!boardId) {
    return res.status(400).json({
      message: "boardId is required",
    });
  }

  // Find board

  const board = await boardModel.findById(boardId);

  if (!board) {
    return res.status(404).json({
      message: "Board not found",
    });
  }

  // Check membership

  const isMember = board.members.some((member) => member.toString() === userId);

  if (!isMember) {
    return res.status(403).json({
      message: "You are not a member of this board",
    });
  }

  // Find lists

  const lists = await listModel
    .find({
      board: boardId,
    })
    .sort({
      position: 1,
    });

  return res.status(200).json({
    message: "Lists fetched successfully",

    lists,
  });
});

// =====================================================
// GET ALL CARDS INSIDE BOARD LIST
// =====================================================

app.get("/all-cards-inside-board-list", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const { boardId, listId } = req.query;

  // Check input

  if (!boardId || !listId) {
    return res.status(400).json({
      message: "boardId and listId are required",
    });
  }

  // Find board

  const board = await boardModel.findById(boardId);

  if (!board) {
    return res.status(404).json({
      message: "Board not found",
    });
  }

  // Check membership

  const isMember = board.members.some((member) => member.toString() === userId);

  if (!isMember) {
    return res.status(403).json({
      message: "You are not a member of this board",
    });
  }

  // Find list

  const list = await listModel.findById(listId);

  if (!list) {
    return res.status(404).json({
      message: "List not found",
    });
  }

  // Check list belongs to board

  if (list.board.toString() !== boardId) {
    return res.status(400).json({
      message: "List does not belong to this board",
    });
  }

  // Find cards

  const cards = await cardModel
    .find({
      board: boardId,
      list: listId,
    })
    .sort({
      position: 1,
    });

  return res.status(200).json({
    message: "Cards fetched successfully",

    cards,
  });
});

// =====================================================
// GET ORGANIZATION MEMBERS
// =====================================================

app.get("/org-members-inside-org", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const { organizationId } = req.query;

  // Check input

  if (!organizationId) {
    return res.status(400).json({
      message: "organizationId is required",
    });
  }

  // Find organization

  const organization = await organizationModel
    .findById(organizationId)
    .populate("members", "username");

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check whether current user
  // belongs to organization

  const isMember = organization.members.some(
    (member) => member._id.toString() === userId,
  );

  if (!isMember) {
    return res.status(403).json({
      message: "You are not a member of this organization",
    });
  }

  return res.status(200).json({
    message: "Organization members fetched successfully",

    members: organization.members,
  });
});

// =====================================================
// MOVE CARD FROM ONE LIST TO ANOTHER
// =====================================================

app.put(
  "/shift-card-from-one-list-to-another",
  authMiddleware,
  async (req, res) => {
    const userId = req.userId;

    const { cardId, newListId } = req.body;

    // Check input

    if (!cardId || !newListId) {
      return res.status(400).json({
        message: "cardId and newListId are required",
      });
    }

    // Find card

    const card = await cardModel.findById(cardId);

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    // Find destination list

    const newList = await listModel.findById(newListId);

    if (!newList) {
      return res.status(404).json({
        message: "Destination list not found",
      });
    }

    // Find board

    const board = await boardModel.findById(card.board);

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    // Check board membership

    const isMember = board.members.some(
      (member) => member.toString() === userId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this board",
      });
    }

    // Check destination list
    // belongs to same board

    if (newList.board.toString() !== board._id.toString()) {
      return res.status(400).json({
        message: "Destination list does not belong to this board",
      });
    }

    // Find last card in destination list

    const lastCard = await cardModel
      .findOne({
        list: newListId,
      })
      .sort({
        position: -1,
      });

    // Calculate new position

    const newPosition = lastCard ? lastCard.position + 1 : 0;

    // Move card

    card.list = newListId;

    card.position = newPosition;

    // Save

    await card.save();

    return res.status(200).json({
      message: "Card moved successfully",

      card,
    });
  },
);

// =====================================================
// REMOVE MEMBER FROM ORGANIZATION
// =====================================================

app.delete("/members", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const organizationId = req.body.organizationId;

  const memberUsername = req.body.memberUsername;

  // Find organization

  const organization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!organization) {
    return res.status(404).json({
      message: "Organization not found",
    });
  }

  // Check admin

  if (organization.admin.toString() !== userId) {
    return res.status(403).json({
      message: "Only organization admin can remove members",
    });
  }

  // Find member

  const memberUser = await userModel.findOne({
    username: memberUsername,
  });

  if (!memberUser) {
    return res.status(404).json({
      message: "No user with this username exists in our db",
    });
  }

  // Remove member

  organization.members = organization.members.filter(
    (member) => member.toString() !== memberUser._id.toString(),
  );

  // Save

  await organization.save();

  return res.json({
    message: "Member deleted!",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});