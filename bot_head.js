require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    Events,
    PermissionsBitField,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const express = require('express');
const app2 = express();
app2.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const CHANNEL_ID = '1506756654115324158';
const GUILD_ID = '1472719357044981897';
const PARTNER_REQUEST_CHANNEL_ID = '1507739595691786260';
const PARTNER_CATEGORY_ID = '1507318203511083008';
const LOG_CHANNEL_ID = '1507062387940003991';
const TICKET_LOG_CHANNEL_ID = '1500226290043584803';
const STAFF_LOG_CHANNEL_ID = '1507753472295047198';
const ANNOUNCEMENT_CHANNEL_ID = '1500226225757491443';
const GAME_SUGGESTION_PANEL_CHANNEL_ID = '1507774193654304788';
const GAME_SUGGESTION_REQUEST_CHANNEL_ID = '1507777547997949444';
const TICKET_REMINDER_DELAY = 30 * 60 * 1000;
const VIP_ROLE_ID = '1506789626776391801';
const STAFF_ROLE_ID = '1500226212885168249';
const GAME_SUGGESTION_NOTICE_ROLE_ID = '1507895712321503273';
const AUTO_ROLE_IDS = ['1500226217176207382', '1500226219449389247'];
const TICKET_CATEGORY_ID = '1501004484308893746';
const TICKET_CHANNEL_ID = '1500231381802942694';
const WELCOME_CHANNEL_ID = '1500273363971477604';
