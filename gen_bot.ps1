$out = "D:\Buis\compta-rp\bot_complet.js"

$c = @"
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, Events, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const app2 = express();
app2.use(express.json());
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers], partials: [Partials.Channel] });
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
const gamesPath = './games';
const dataPath = './data';
const usersFile = path.join(dataPath, 'users.json');
const downloadsFile = path.join(dataPath, 'downloads.json');
const invitesFile = path.join(dataPath, 'invites.json');
const MAIN_IMAGE = 'https://media.discordapp.net/attachments/1500226288139632690/1507318906258460762/ChatGPT_Image_3_mai_2026_00_51_28.png?ex=6a11779f&is=6a10261f&hm=52e53de1688d12ac164731a7f8792934276910525652a5959c2df2bfc332cec3&=&format=webp&quality=lossless&width=714&height=714';
const PARTNER_IMAGE = 'https://media.discordapp.net/attachments/1500226288139632690/1507320846803537950/2899b8a7-ec62-4882-9d17-14f8ddaf2954.png?ex=6a11796e&is=6a1027ee&hm=0c5ad52ca2ddb399204cdc7503b2225e56ffdf57b4d39229bad1954f6e6e388f&=&format=webp&quality=lossless&width=714&height=714';
const TICKET_IMAGE = 'https://cdn.discordapp.com/attachments/1500226288139632690/1507342175158140928/ce15e0c4-4be5-49fa-95e3-156c82434829.png?ex=6a118d4b&is=6a103bcb&hm=93695c8b63daf94b71589b9116eac2cd34e4989d6ec48c31aa7f39ea2e50bde0&';
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
if (!fs.existsSync(downloadsFile)) fs.writeFileSync(downloadsFile, '{}');
if (!fs.existsSync(invitesFile)) fs.writeFileSync(invitesFile, '{}');
let users = JSON.parse(fs.readFileSync(usersFile));
let downloads = JSON.parse(fs.readFileSync(downloadsFile));
function saveUsers() { fs.writeFileSync(usersFile, JSON.stringify(users, null, 4)); }
function saveDownloads() { fs.writeFileSync(downloadsFile, JSON.stringify(downloads, null, 4)); }
function loadInvites() { try { const raw = fs.readFileSync(invitesFile, 'utf-8').trim(); if (!raw) return {}; return JSON.parse(raw); } catch { return {}; } }
function saveInvites(data) { fs.writeFileSync(invitesFile, JSON.stringify(data, null, 4)); }
function ensureUser(userId) {
  if (!users[userId]) { users[userId] = { downloads: 0, library: [], joinedAt: new Date().toISOString(), firstSeenAt: Date.now(), favoriteGame: null, invites: 0, invitedBy: null, invitedAt: null }; saveUsers(); }
  users[userId].library ||= []; users[userId].joinedAt ||= new Date().toISOString(); users[userId].firstSeenAt ||= Date.now();
  if (!Object.prototype.hasOwnProperty.call(users[userId], 'favoriteGame')) users[userId].favoriteGame = null;
  if (!Object.prototype.hasOwnProperty.call(users[userId], 'invites')) users[userId].invites = 0;
  if (!Object.prototype.hasOwnProperty.call(users[userId], 'invitedBy')) users[userId].invitedBy = null;
  if (!Object.prototype.hasOwnProperty.call(users[userId], 'invitedAt')) users[userId].invitedAt = null;
  return users[userId];
}
function formatSize(bytes) { if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' Go'; if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' Mo'; return (bytes / 1024).toFixed(2) + ' Ko'; }
function formatDuration(ms) { const m = Math.floor(ms / 60000); const d = Math.floor(m / 1440); const h = Math.floor((m % 1440) / 60); const mn = m % 60; if (d > 0) return d + 'j ' + h + 'h ' + mn + 'm'; if (h > 0) return h + 'h ' + mn + 'm'; return mn + 'm'; }
function getUserRank(dc) { if (dc >= 50) return '🏆 Légende'; if (dc >= 25) return '🥇 Expert'; if (dc >= 10) return '🥈 Confirmé'; if (dc >= 3) return '🥉 Actif'; return '🎮 Nouveau'; }
function getFavoriteGame(ud) { if (ud.favoriteGame) return ud.favoriteGame; if (ud.library.length > 0) return ud.library[ud.library.length - 1]; return 'Aucun jeu'; }
function getFileSize(fn) { const p = path.join(gamesPath, path.basename(fn)); if (!fs.existsSync(p)) return 'Inconnue'; return formatSize(fs.statSync(p).size); }
function getTicketTypeLabel(t) { return { support: 'Support', vip: 'Achat VIP', partner: 'Partenariat', bug: 'Bug', game: 'Demande jeu' }[t] || 'Support'; }
function getTicketTypeEmoji(t) { return { support: '🛠️', vip: '💎', partner: '🤝', bug: '🐛', game: '🎮' }[t] || '🎫'; }
function getEmbedField(e, fn) { const f = e.fields.find(i => i.name === fn); return f ? f.value : 'Non renseigné'; }
function getUserIdFromText(t) { const m = t.match(/\d{17,20}/); return m ? m[0] : null; }
function getRequesterIdFromEmbed(e) { const fi = getUserIdFromText(e.footer?.text || ''); if (fi) return fi; return getUserIdFromText(getEmbedField(e, '👤 Demandeur')); }
function getTicketInfo(c) { const t = c.topic || ''; return { ownerId: t.match(/ticket-owner:(\d+)/)?.[1] || null, type: t.match(/ticket-type:([a-z]+)/)?.[1] || 'support' }; }
async function sendStaffLog(title, fields, color) { color = color || '#7A00FF'; try { const ch = await client.channels.fetch(STAFF_LOG_CHANNEL_ID); if (!ch) return; await ch.send({ embeds: [new EmbedBuilder().setTitle(title).addFields(fields).setColor(color).setTimestamp()] }); } catch (e) { console.log(e); } }
async function sendTicketLog(type, tc, member, sm) {
  try { const ch = await client.channels.fetch(TICKET_LOG_CHANNEL_ID); if (!ch) return; const ti = getTicketInfo(tc); const ic = type === 'close'; const ir = type === 'reminder';
    const eb = new EmbedBuilder().setTitle(ic ? '🔒 Ticket fermé' : ir ? '⏰ Rappel ticket' : '🎫 Ticket créé')
      .addFields({ name: '👤 Membre', value: member ? member.toString() : 'Inconnu', inline: true }, { name: '📌 Type', value: getTicketTypeLabel(ti.type), inline: true }, { name: '🕒 Heure', value: '<t:' + Math.floor(Date.now() / 1000) + ':F' })
      .setColor(ic ? '#FF0000' : ir ? '#FFAA00' : '#7A00FF').setTimestamp();
    if (sm) eb.addFields({ name: '🛡️ Staff', value: sm.toString(), inline: true }); await ch.send({ embeds: [eb] });
  } catch (e) { console.log(e); }
}
async function scheduleTicketReminder(tc, to, tt) {
  setTimeout(async () => {
    try { const ch = await client.channels.fetch(tc.id).catch(() => null); if (!ch) return; const msgs = await ch.messages.fetch({ limit: 50 });
      const hasStaff = msgs.some(m => !m.author.bot && m.member && m.member.roles.cache.has(STAFF_ROLE_ID)); if (hasStaff) return;
      await ch.send({ content: '<@&' + STAFF_ROLE_ID + '> ⏰ Ce ticket **' + getTicketTypeLabel(tt) + '** attend toujours une réponse staff.' });
      await sendTicketLog('reminder', ch, to);
    } catch (e) { console.log(e); }
  }, TICKET_REMINDER_DELAY);
}
function getGames() { if (!fs.existsSync(gamesPath)) fs.mkdirSync(gamesPath); return fs.readdirSync(gamesPath).map(f => { const s = fs.statSync(path.join(gamesPath, f)); const l = f.toLowerCase(); let c = 'Action'; let e = '🎮'; if (l.includes('gta')) { c = 'Open World'; e = '🚔'; } else if (l.includes('batman')) e = '🦇'; else if (l.includes('forza')) { c = 'Course'; e = '🏎️'; } else if (l.includes('subnautica')) { c = 'Survie'; e = '🌊'; } return { file: f, name: path.parse(f).name, description: c + ' • ' + formatSize(s.size), size: formatSize(s.size), image: MAIN_IMAGE, emoji: e }; }); }
function createGamesEmbed(page) { page = page || 0; const games = getGames(); const pp = 5; const cg = games.slice(page * pp, page * pp + pp); const tp = Math.max(Math.ceil(games.length / pp), 1); const rows = [];
  const embed = new EmbedBuilder().setTitle('👾 LaCorpo Generateur').setDescription(cg.length > 0 ? cg.map(g => g.emoji + ' **' + g.name + '**\n' + g.description).join('\n\n') : 'Aucun jeu disponible pour le moment.').setColor('#7A00FF').setImage(MAIN_IMAGE).setFooter({ text: 'Page ' + (page + 1) + ' / ' + tp });
  if (cg.length > 0) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('games_menu_' + page).setPlaceholder('🎮 Choisis un jeu').addOptions(cg.map(g => ({ label: g.name.slice(0, 100), description: g.description.slice(0, 100), emoji: g.emoji, value: g.file })))));
  rows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('page_' + (page - 1)).setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page <= 0), new ButtonBuilder().setCustomId('page_' + (page + 1)).setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page >= tp - 1)));
  return { embed, rows };
}
function ticketButtons() { return new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('claim_ticket').setLabel('🛡️ Prendre en charge').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('close_ticket').setLabel('❌ Fermer').setStyle(ButtonStyle.Danger)); }
async function refreshInviteCache(guild) { try { const gi = await guild.invites.fetch(); const c = loadInvites(); c[guild.id] = {}; gi.each(inv => { c[guild.id][inv.code] = inv.uses; }); saveInvites(c); } catch (e) { console.log('Erreur refresh cache invitations:', e); } }
"@
$c | Out-File -LiteralPath $out -Encoding utf8
Write-Host "Part 1 written: $((Get-Item $out).Length) bytes"
