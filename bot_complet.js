require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, Events, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const app2 = express();
app2.use(express.json());
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers], partials: [Partials.Channel] });
client.once(Events.ClientReady, async () => {
  console.log('✅ Connecté : ' + client.user.tag);
  client.user.setActivity('🎮 GTA 6');
  const guild = client.guilds.cache.get(GUILD_ID);
  if (guild) { await refreshInviteCache(guild); console.log('✅ Cache invitations initialisé.'); setInterval(() => refreshInviteCache(guild), 300000); }
  try { const tc = await client.channels.fetch(WELCOME_CHANNEL_ID); console.log('✅ Salon bienvenue trouvé: #' + tc.name + ' (' + tc.id + ')'); } catch (e) { console.log('❌ Impossible salon bienvenue:', e.message); }
  const ch = await client.channels.fetch(CHANNEL_ID);
  await ch.send({ embeds: [new EmbedBuilder().setTitle('👾 LaCorpo').setDescription(['🔥 Serveur officiel', '🎮 Jeux gratuits', '💎 VIP', '🤝 Communauté'].join('\n')).setColor('#7A00FF').setImage(MAIN_IMAGE)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('games_page_0').setLabel('Voir les jeux').setEmoji('🎮').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('profile_button').setLabel('Mon profil').setEmoji('👤').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('top_button').setLabel('Top jeux').setEmoji('🔥').setStyle(ButtonStyle.Success))] });
  const gsp = await client.channels.fetch(GAME_SUGGESTION_PANEL_CHANNEL_ID);
  await gsp.send({ embeds: [new EmbedBuilder().setTitle('💡 Proposer un jeu').setDescription('Clique sur le bouton ci-dessous pour envoyer une proposition de jeu au staff.').setColor('#7A00FF').setImage(MAIN_IMAGE)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_game_suggestion_modal').setLabel('Proposer un jeu').setEmoji('💡').setStyle(ButtonStyle.Primary))] });
  const tch = await client.channels.fetch(TICKET_CHANNEL_ID);
  await tch.send({ embeds: [new EmbedBuilder().setTitle('🎫 Support LaCorpo').setDescription('Choisis le type de ticket à ouvrir.').setColor('#7A00FF').setImage(TICKET_IMAGE)], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('ticket_type_menu').setPlaceholder('📌 Type de ticket').addOptions({ label: 'Support', description: 'Besoin d\'aide générale', emoji: '🛠️', value: 'support' }, { label: 'Achat VIP', description: 'Question ou achat VIP', emoji: '💎', value: 'vip' }, { label: 'Partenariat', description: 'Demande de partenariat', emoji: '🤝', value: 'partner' }, { label: 'Bug', description: 'Signaler un problème', emoji: '🐛', value: 'bug' }, { label: 'Demande jeu', description: 'Demander un nouveau jeu', emoji: '🎮', value: 'game' }))] });
});
client.on(Events.InviteCreate, async invite => { const c = loadInvites(); if (!c[invite.guild.id]) c[invite.guild.id] = {}; c[invite.guild.id][invite.code] = invite.uses; saveInvites(c); });
client.on(Events.GuildMemberAdd, async member => {
  try { for (const rid of AUTO_ROLE_IDS) { const r = member.guild.roles.cache.get(rid); if (r) await member.roles.add(rid).catch(e => console.log('Erreur ajout rôle ' + rid + ':', e)); }
    const wc = await client.channels.fetch(WELCOME_CHANNEL_ID); if (wc) { const c = loadInvites(); const oi = c[member.guild.id] || {}; let inviter = null;
      try { const gi = await member.guild.invites.fetch(); for (const [code, inv] of gi) { if (inv.uses > (oi[code] || 0)) { inviter = inv.inviter; break; } } const nc = {}; gi.each(i => { nc[i.code] = i.uses; }); c[member.guild.id] = nc; saveInvites(c); } catch (e) { console.log('Erreur tracking invitation:', e); }
      if (inviter) { const ud = ensureUser(member.id); ud.invitedBy = inviter.id; ud.invitedAt = new Date().toISOString(); saveUsers(); const id2 = ensureUser(inviter.id); id2.invites++; saveUsers(); }
      const ic2 = inviter ? (ensureUser(inviter.id).invites) : null;
      await wc.send({ content: inviter ? 'Bienvenue dans la corpo, ' + member + '!\nTu as été invité(e) par ' + inviter + ' qui a maintenant **' + ic2 + '** invitation(s).' : 'Bienvenue dans la corpo, ' + member + '!' });
    }
  } catch (e) { console.log('Erreur message bienvenue:', e); }
});
client.on(Events.GuildMemberRemove, async member => { try { const ud = ensureUser(member.id); if (ud.invitedBy) { const id2 = ensureUser(ud.invitedBy); if (id2.invites > 0) { id2.invites--; saveUsers(); } } } catch (e) { console.log('Erreur guildMemberRemove:', e); } });
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) {
    try { const guild = await client.guilds.fetch(GUILD_ID); await guild.channels.fetch();
      const et = guild.channels.cache.find(ch => ch.parentId === TICKET_CATEGORY_ID && ch.topic && ch.topic.includes('ticket-owner:' + message.author.id));
      const content = message.content?.trim() || 'Aucun texte';
      if (et) { if (et.topic.includes('ticket-source:dm')) { await et.send({ embeds: [new EmbedBuilder().setTitle('📩 Nouveau message MP').setDescription(['👤 Membre : ' + message.author, '🆔 ID : ' + message.author.id, '', '📝 Message :', content].join('\n')).setColor('#7A00FF').setTimestamp()] }); if (message.attachments.size > 0) await et.send({ content: ['📎 Pièces jointes :', ...message.attachments.map(a => a.url)].join('\n') }); return message.reply('✅ Message transmis au staff.'); } return message.reply('Tu as déjà un ticket ouvert.'); }
      const member = await guild.members.fetch(message.author.id).catch(() => null);
      const ticket = await guild.channels.create({ name: 'ticket-mp-' + message.author.username, type: ChannelType.GuildText, parent: TICKET_CATEGORY_ID, topic: 'ticket-owner:' + message.author.id + ';ticket-type:support;ticket-source:dm', permissionOverwrites: [{ id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] });
      await ticket.send({ content: '<@&' + STAFF_ROLE_ID + '>', embeds: [new EmbedBuilder().setTitle('📩 Ticket créé depuis un MP').setDescription(['👤 Membre : ' + message.author, '🆔 ID : ' + message.author.id, '', '📝 Message :', content].join('\n')).setColor('#7A00FF').setTimestamp()], components: [ticketButtons()] });
      if (message.attachments.size > 0) await ticket.send({ content: ['📎 Pièces jointes :', ...message.attachments.map(a => a.url)].join('\n') });
      await sendTicketLog('create', ticket, member || message.author); return message.reply('✅ Ticket créé. Le staff répondra ici en MP.');
    } catch (e) { console.log(e); return message.reply('❌ Impossible de créer ton ticket.'); }
  }
  if (message.channel?.topic?.includes('ticket-source:dm') && message.member?.roles.cache.has(STAFF_ROLE_ID)) {
    const ti = getTicketInfo(message.channel); if (!ti.ownerId) return;
    try { const user = await client.users.fetch(ti.ownerId); await user.send({ embeds: [new EmbedBuilder().setTitle('💬 Réponse du staff').setDescription(message.content?.trim() || 'Aucun texte').setFooter({ text: 'Staff: ' + message.author.tag }).setColor('#7A00FF').setTimestamp()] }); if (message.attachments.size > 0) await user.send({ content: ['📎 Pièces jointes :', ...message.attachments.map(a => a.url)].join('\n') }); return message.react('✅'); } catch (e) { console.log(e); return message.reply('❌ Impossible d\'envoyer en MP.'); }
  }
  const content = message.content.toLowerCase();
  if (content.startsWith('!annonce')) {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return message.reply('❌ Seul le staff peut utiliser cette commande.');
    const at = message.content.replace(/^!annonce\s*/i, '').trim(); if (!at) return message.reply('❌ Utilisation : !annonce ton message');
    try { const tc = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
      const ments = [...at.matchAll(/<@!?\d{17,20}>|<@&\d{17,20}>/g)].map(m => m[0]); if (at.includes('@everyone')) ments.push('@everyone'); if (at.includes('@here')) ments.push('@here');
      await tc.send({ content: ments.length > 0 ? [...new Set(ments)].join(' ') : null, embeds: [new EmbedBuilder().setTitle('📢 Annonce LaCorpo').setDescription(at).setColor('#7A00FF').setImage(MAIN_IMAGE).setFooter({ text: 'Annonce par ' + message.author.tag }).setTimestamp()], allowedMentions: { parse: ['users', 'roles', 'everyone'] } });
      await sendStaffLog('📢 Annonce envoyée', [{ name: '🛡️ Staff', value: message.author.tag + ' (' + message.author.id + ')' }, { name: '📌 Salon', value: tc.toString() }, { name: '📝 Message', value: at.slice(0, 1024) }], '#7A00FF');
      return message.reply('✅ Annonce envoyée dans ' + tc + '.');
    } catch (e) { console.log(e); return message.reply('❌ Impossible d\'envoyer l\'annonce.'); }
  }
  if (content === '!vip') return message.reply({ embeds: [new EmbedBuilder().setTitle('💎 VIP LaCorpo').setDescription(['🔥 Accès VIP', '', '💳 PayPal : paypal.me/IlhanTvN20', '🏦 RIB : FR7628233000014908240841204', '🏦 BIC : REVOFRP2'].join('\n')).setColor('#FFD700').setImage(MAIN_IMAGE)] });
  if (content.startsWith('!vipadd')) {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return message.reply('❌ Seul le staff peut utiliser cette commande.');
    const m = message.mentions.members.first(); if (!m) return message.reply('❌ !vipadd @membre');
    if (m.roles.cache.has(VIP_ROLE_ID)) return message.reply('⚠️ Déjà VIP.');
    try { await m.roles.add(VIP_ROLE_ID); await m.send('🎉 Tu es maintenant VIP sur LaCorpo !').catch(() => {}); await sendStaffLog('💎 VIP ajouté', [{ name: '🛡️ Staff', value: message.author.tag + ' (' + message.author.id + ')' }, { name: '👤 Membre', value: m.user.tag + ' (' + m.id + ')' }, { name: '🕒 Heure', value: '<t:' + Math.floor(Date.now() / 1000) + ':F' }], '#FFD700'); return message.reply('✅ Rôle VIP ajouté à ' + m + '.'); } catch (e) { console.log(e); return message.reply('❌ Impossible d\'ajouter le rôle.'); }
  }
  if (content === '!partner') return message.reply({ embeds: [new EmbedBuilder().setTitle('🤝 Partenariat LaCorpo').setDescription('Clique sur le bouton pour envoyer une demande de partenariat au staff.').setColor('#7A00FF')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_partner_modal').setLabel('Faire une demande').setEmoji('🤝').setStyle(ButtonStyle.Primary))] });
  if (content.startsWith('!detecte')) {
    const m = message.mentions.members.first(); if (!m) return message.reply('❌ !detecte @membre');
    const ud = ensureUser(m.id); if (!ud.invitedBy) return message.reply('❌ Aucun inviteur trouvé.');
    try { const inv = await client.users.fetch(ud.invitedBy); return message.reply('👤 ' + m.user.tag + ' a été invité par **' + inv.tag + '**'); } catch (e) { return message.reply('👤 ' + m.user.tag + ' a été invité par <@' + ud.invitedBy + '>'); }
  }
  if (content === '!invites') { const ud = ensureUser(message.author.id); return message.reply('📊 Tu as invité **' + (ud.invites || 0) + '** membre(s).'); }
  if (message.content.startsWith('!ask')) {
    const q = message.content.replace(/^!ask\s*/i, '').trim(); if (!q) return message.reply('❌ Pose une question.');
    await message.channel.sendTyping();
    try { const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: q }] }] }) }); const data = await res.json(); const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 1900) || '❌ Pas de réponse.'; await message.reply(reply); } catch (e) { await message.reply('❌ Erreur IA : ' + (e.message || 'vérifie ta clé API')); }
  }
  if (content === '!clear') { await message.reply('🧹 Mémoire IA effacée.'); }
  if (message.content.startsWith('!fauxjustif')) {
    const args = message.content.replace(/^!fauxjustif\s*/i, '').trim(); if (!args) return message.reply('❌ !fauxjustif <montant> [description]');
    const parts = args.match(/^(\d+[\d.,]*)\s*(.*)/); if (!parts) return message.reply('❌ Montant invalide.');
    const montant = parseFloat(parts[1].replace(',', '.').replace(/\s/g, '')); if (isNaN(montant) || montant <= 0) return message.reply('❌ Montant invalide.');
    const desc = parts[2]?.trim() || 'Prestation de services'; const date = new Date().toLocaleDateString('fr-FR');
    const id = 'FAK-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const types = ['Facture', 'Reçu', 'Avoir', "Note d'honoraires"]; const type = types[Math.floor(Math.random() * types.length)];
    const clients = ['Client Anonyme', 'Société Durand SAS', 'Cabinet Lambert', 'Entreprise Moreau', 'SARL Leclerc']; const client = clients[Math.floor(Math.random() * clients.length)];
    const cats = ['Prestation', 'Conseil', 'Honoraires', 'Services', 'Fournitures']; const cat = cats[Math.floor(Math.random() * cats.length)];
    const params = new URLSearchParams({ montant, description: desc, type, id, date, client, categorie: cat, qte: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 1 });
    const url = 'https://compta-rp.vercel.app/justificatif.html?' + params;
    try { await message.author.send({ embeds: [new EmbedBuilder().setTitle('📄 Votre justificatif').setDescription('**' + type + '** • ' + id + '\n\nMontant : **' + montant.toFixed(2) + ' $**\n' + desc + '\n' + client + '\n' + date).setURL(url).setColor('#e67e22')] }); await message.reply('✅ Justificatif envoyé en MP !'); } catch (e) { await message.reply('📄 **' + type + '** • ' + id + '\nMontant : **' + montant.toFixed(2) + ' $**\n' + desc + '\n' + client + '\n' + date + '\n\n🔗 ' + url); }
  }
});
const FONDATEUR_ID = '1472535396205461554';
const COMMISSION_PERCENT = 50;
const commissionsFile = path.join(dataPath, 'commissions.json');
if (!fs.existsSync(commissionsFile)) fs.writeFileSync(commissionsFile, '{}');
let commissions = JSON.parse(fs.readFileSync(commissionsFile));
function saveCommissions() { fs.writeFileSync(commissionsFile, JSON.stringify(commissions, null, 4)); }
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content.startsWith('!vente')) {
    if (message.author.id !== FONDATEUR_ID) return message.reply('❌ Seul le fondateur peut utiliser cette commande.');
    const args = message.content.split(' '); const vendeur = message.mentions.users.first(); const montant = parseFloat(args[2]);
    if (!vendeur || isNaN(montant)) return message.reply('❌ !vente @vendeur montant');
    const comm = (montant * COMMISSION_PERCENT) / 100;
    if (!commissions[vendeur.id]) commissions[vendeur.id] = { totalVentes: 0, totalCommission: 0 };
    commissions[vendeur.id].totalVentes += montant; commissions[vendeur.id].totalCommission += comm; saveCommissions();
    try { await vendeur.send('💰 Nouvelle commission reçue !\n\n💵 Vente : ' + montant + '€\n📈 Commission : ' + comm.toFixed(2) + '€\n🏦 Total : ' + commissions[vendeur.id].totalCommission.toFixed(2) + '€'); } catch (e) {}
    try { const lc = await client.channels.fetch(LOG_CHANNEL_ID); if (lc) await lc.send('💰 Vente ajoutée\n👤 Vendeur : ' + vendeur.tag + '\n💵 Vente : ' + montant + '€\n📈 Commission : ' + comm.toFixed(2) + '€'); } catch (e) {}
    return;
  }
  if (message.content.startsWith('!commission')) {
    const user = message.mentions.users.first() || message.author;
    if (!commissions[user.id]) return message.author.send('❌ Aucune commission trouvée.');
    return message.author.send('📊 Commission de ' + user.tag + '\n\n💵 Total ventes : ' + commissions[user.id].totalVentes.toFixed(2) + '€\n📈 Total commissions : ' + commissions[user.id].totalCommission.toFixed(2) + '€');
  }
  if (message.content.startsWith('!retirercommission')) {
    if (message.author.id !== FONDATEUR_ID) return message.reply('❌ Seul le fondateur peut utiliser cette commande.');
    const args = message.content.split(' '); const vendeur = message.mentions.users.first(); const montant = parseFloat(args[2]);
    if (!vendeur || isNaN(montant)) return message.reply('❌ !retirercommission @vendeur montant');
    if (!commissions[vendeur.id]) return message.reply('❌ Ce vendeur n\'a aucune commission.');
    commissions[vendeur.id].totalCommission -= montant; if (commissions[vendeur.id].totalCommission < 0) commissions[vendeur.id].totalCommission = 0; saveCommissions();
    try { await vendeur.send('❌ Commission retirée.\n\n💸 Retrait : ' + montant + '€\n🏦 Restant : ' + commissions[vendeur.id].totalCommission.toFixed(2) + '€'); } catch (e) {}
    try { const lc = await client.channels.fetch(LOG_CHANNEL_ID); if (lc) await lc.send('❌ Commission retirée\n👤 Vendeur : ' + vendeur.tag + '\n💸 Retrait : ' + montant + '€'); } catch (e) {}
  }
});
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('games_page_')) { const d = createGamesEmbed(parseInt(interaction.customId.split('_')[2], 10)); return interaction.reply({ embeds: [d.embed], components: d.rows, ephemeral: true }); }
    if (interaction.customId.startsWith('page_')) { const d = createGamesEmbed(parseInt(interaction.customId.split('_')[1], 10)); return interaction.update({ embeds: [d.embed], components: d.rows }); }
    if (interaction.customId === 'profile_button') {
      const p = ensureUser(interaction.user.id); const ca = new Date(p.joinedAt);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('👤 ' + interaction.user.username).setThumbnail(interaction.user.displayAvatarURL()).addFields({ name: '📥 Téléchargements', value: '' + p.downloads, inline: true }, { name: '🏆 Rang', value: getUserRank(p.downloads), inline: true }, { name: '💎 Statut VIP', value: interaction.member.roles.cache.has(VIP_ROLE_ID) ? 'Oui' : 'Non', inline: true }, { name: '📅 Inscription', value: '<t:' + Math.floor(ca.getTime() / 1000) + ':D>', inline: true }, { name: '⏱ Temps passé', value: formatDuration(Date.now() - p.firstSeenAt), inline: true }, { name: '🔥 Jeu préféré', value: getFavoriteGame(p), inline: true }, { name: '📚 Bibliothèque', value: p.library.length > 0 ? p.library.slice(0, 10).join('\n') : 'Aucun jeu' }).setColor('#7A00FF')], ephemeral: true });
    }
    if (interaction.customId === 'top_button') {
      const s = Object.entries(downloads).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🔥 Top jeux').setDescription(s.length > 0 ? s.map((g, i) => (i + 1) + '. ' + g[0] + ' — ' + g[1] + ' téléchargements').join('\n') : 'Aucun téléchargement').setColor('#7A00FF')], ephemeral: true });
    }
    if (interaction.customId === 'open_game_suggestion_modal') {
      const modal = new ModalBuilder().setCustomId('game_suggestion_modal').setTitle('Proposer un jeu');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggestion_game_name').setLabel('Nom du jeu').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggestion_link').setLabel('Lien utile').setPlaceholder('Steam, Epic Games...').setStyle(TextInputStyle.Short).setRequired(false)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggestion_reason').setLabel('Pourquoi ce jeu ?').setStyle(TextInputStyle.Paragraph).setRequired(true)));
      return interaction.showModal(modal);
    }
    if (interaction.customId === 'open_partner_modal') {
      const modal = new ModalBuilder().setCustomId('partner_modal').setTitle('Demande de partenariat');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('partner_server_name').setLabel('Nom du serveur').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('partner_members').setLabel('Nombre de membres').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('partner_invite').setLabel('Lien du serveur').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('partner_description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)));
      return interaction.showModal(modal);
    }
    if (interaction.customId === 'game_suggestion_refuse') {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff peut gérer les suggestions.', ephemeral: true });
      const modal = new ModalBuilder().setCustomId('game_suggestion_refuse_reason_' + interaction.message.id).setTitle('Raison du refus');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('refuse_reason').setLabel('Pourquoi ?').setStyle(TextInputStyle.Paragraph).setRequired(true)));
      return interaction.showModal(modal);
    }
    if (interaction.customId === 'game_suggestion_accept') {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff peut gérer les suggestions.', ephemeral: true });
      await interaction.deferUpdate(); const se = interaction.message.embeds[0]; if (!se) return;
      const gn = getEmbedField(se, '🎮 Jeu'); const ri = getRequesterIdFromEmbed(se);
      await interaction.message.edit({ embeds: [EmbedBuilder.from(se).setColor('#00FF7F').addFields({ name: '✅ Statut', value: 'Acceptée par ' + interaction.user })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('gs_accept_done').setLabel('Acceptée').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId('gs_refuse_done').setLabel('Refusée').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(true))] });
      await sendStaffLog('✅ Suggestion jeu acceptée', [{ name: '🛡️ Staff', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🎮 Jeu', value: gn }], '#00FF7F');
      if (ri) { const r = await client.users.fetch(ri).catch(() => null); await r?.send('✅ Ta suggestion **' + gn + '** a été acceptée par le staff LaCorpo.').catch(() => {}); }
    }
    if (interaction.customId === 'gs_accept_done' || interaction.customId === 'gs_refuse_done') return interaction.reply({ content: 'Déjà traitée.', ephemeral: true });
    if (interaction.customId === 'partner_accept' || interaction.customId === 'partner_refuse') {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff peut gérer les partenariats.', ephemeral: true });
      const se = interaction.message.embeds[0]; if (!se) return;
      const sn = getEmbedField(se, '🏷️ Nom serveur'); const mb = getEmbedField(se, '👥 Membres'); const inv = getEmbedField(se, '🔗 Lien'); const desc = getEmbedField(se, '📝 Description'); const ri = getRequesterIdFromEmbed(se);
      const accepted = interaction.customId === 'partner_accept'; await interaction.deferUpdate();
      if (accepted) {
        try { const cn = sn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'partenaire';
          const pc = await interaction.guild.channels.create({ name: 'partenaire-' + cn, type: ChannelType.GuildText, parent: PARTNER_CATEGORY_ID, permissionOverwrites: [{ id: interaction.guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }, { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] });
          await pc.send({ embeds: [new EmbedBuilder().setTitle('🤝 Partenaire : ' + sn).addFields({ name: '👥 Membres', value: mb, inline: true }, { name: '🔗 Lien', value: inv }, { name: '📝 Description', value: desc }).setColor('#7A00FF').setImage(PARTNER_IMAGE).setTimestamp()] });
        } catch (e) { console.log('Salon partenaire impossible à créer.'); }
      }
      await interaction.message.edit({ embeds: [EmbedBuilder.from(se).setColor(accepted ? '#00FF7F' : '#FF0000').addFields({ name: accepted ? '✅ Statut' : '❌ Statut', value: (accepted ? 'Accepté' : 'Refusé') + ' par ' + interaction.user })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('partner_accept_done').setLabel('Accepté').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId('partner_refuse_done').setLabel('Refusé').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(true))] });
      await sendStaffLog(accepted ? '✅ Partenariat accepté' : '❌ Partenariat refusé', [{ name: '🛡️ Staff', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🏷️ Serveur', value: sn }, { name: '👥 Membres', value: mb, inline: true }, { name: '🔗 Lien', value: inv }], accepted ? '#00FF7F' : '#FF0000');
      if (ri) { const r = await client.users.fetch(ri).catch(() => null); await r?.send(accepted ? '✅ Partenariat **' + sn + '** accepté par le staff LaCorpo.' : '❌ Partenariat **' + sn + '** refusé par le staff LaCorpo.').catch(() => {}); }
    }
    if (interaction.customId === 'partner_accept_done' || interaction.customId === 'partner_refuse_done') return interaction.reply({ content: 'Déjà traitée.', ephemeral: true });
    if (interaction.customId === 'claim_ticket') { if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff.', ephemeral: true }); return interaction.reply({ content: '🛡️ Ticket pris en charge par ' + interaction.user + '.' }); }
    if (interaction.customId === 'close_ticket') {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff.', ephemeral: true });
      await interaction.reply({ content: '❌ Ticket fermé dans 5s.', ephemeral: true }); const ti = getTicketInfo(interaction.channel);
      const to = ti.ownerId ? await interaction.guild.members.fetch(ti.ownerId).catch(() => null) : null;
      if (ti.ownerId && interaction.channel.topic?.includes('ticket-source:dm')) { const u = await client.users.fetch(ti.ownerId).catch(() => null); await u?.send('🔒 Ton ticket a été fermé par le staff.').catch(() => {}); }
      await sendTicketLog('close', interaction.channel, to, interaction.member); setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_type_menu') {
      const tt = interaction.values[0]; const et = interaction.guild.channels.cache.find(ch => ch.parentId === TICKET_CATEGORY_ID && ch.topic && ch.topic.includes('ticket-owner:' + interaction.user.id));
      if (et) return interaction.reply({ content: '❌ Tu as déjà un ticket : ' + et, ephemeral: true });
      const ticket = await interaction.guild.channels.create({ name: 'ticket-' + tt + '-' + interaction.user.username, type: ChannelType.GuildText, parent: TICKET_CATEGORY_ID, topic: 'ticket-owner:' + interaction.user.id + ';ticket-type:' + tt, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] });
      await ticket.send({ embeds: [new EmbedBuilder().setTitle(getTicketTypeEmoji(tt) + ' Ticket ' + getTicketTypeLabel(tt)).setDescription('🎫 Ticket créé par ' + interaction.user + '\n📌 Type : **' + getTicketTypeLabel(tt) + '**\n\nUn membre du staff va te répondre.').setColor('#7A00FF').setTimestamp()], components: [ticketButtons()] });
      await sendTicketLog('create', ticket, interaction.member); await scheduleTicketReminder(ticket, interaction.member, tt);
      return interaction.reply({ content: '✅ Ticket créé : ' + ticket, ephemeral: true });
    }
    if (!interaction.customId.startsWith('games_menu_')) return;
    const sf = interaction.values[0]; const game = getGames().find(g => g.file === sf); const sp = path.join(gamesPath, path.basename(sf));
    if (!game) return interaction.reply({ content: '❌ Jeu introuvable.', ephemeral: true }); if (!fs.existsSync(sp)) return interaction.reply({ content: '❌ Fichier introuvable.', ephemeral: true });
    const p = ensureUser(interaction.user.id); p.downloads++; if (!p.library.includes(sf)) p.library.push(sf); p.favoriteGame = sf; saveUsers();
    downloads[sf] = (downloads[sf] || 0) + 1; saveDownloads();
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle('📥 ' + game.name).setDescription(game.description).setImage(game.image).setColor('#7A00FF')], files: [sp], ephemeral: true });
    const lc = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (lc) await lc.send({ embeds: [new EmbedBuilder().setTitle('📥 Téléchargement').addFields({ name: '👤 Utilisateur', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🎮 Jeu', value: game.name, inline: true }, { name: '📦 Taille', value: getFileSize(sf), inline: true }, { name: '🔥 Total', value: '' + downloads[sf], inline: true }, { name: '🕒 Heure', value: '<t:' + Math.floor(Date.now() / 1000) + ':F' }).setColor('#7A00FF').setTimestamp()] });
  }
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('game_suggestion_refuse_reason_')) {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Seul le staff.', ephemeral: true });
      const mid = interaction.customId.replace('game_suggestion_refuse_reason_', ''); const rr = interaction.fields.getTextInputValue('refuse_reason');
      const sm = await interaction.channel.messages.fetch(mid).catch(() => null); if (!sm || !sm.embeds[0]) return interaction.reply({ content: '❌ Message introuvable.', ephemeral: true });
      const se = sm.embeds[0]; const gn = getEmbedField(se, '🎮 Jeu'); const ri = getRequesterIdFromEmbed(se);
      await sm.edit({ embeds: [EmbedBuilder.from(se).setColor('#FF0000').addFields({ name: '❌ Statut', value: 'Refusée par ' + interaction.user }, { name: '📝 Raison', value: rr })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('gs_accept_done').setLabel('Acceptée').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId('gs_refuse_done').setLabel('Refusée').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(true))] });
      await sendStaffLog('❌ Suggestion jeu refusée', [{ name: '🛡️ Staff', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🎮 Jeu', value: gn }, { name: '📝 Raison', value: rr }], '#FF0000');
      if (ri) { const r = await client.users.fetch(ri).catch(() => null); await r?.send('❌ Ta suggestion **' + gn + '** a été refusée.\n📝 Raison : ' + rr).catch(() => {}); }
      return interaction.reply({ content: '✅ Suggestion refusée.', ephemeral: true });
    }
    if (interaction.customId === 'game_suggestion_modal') {
      const gn = interaction.fields.getTextInputValue('suggestion_game_name'); const link = interaction.fields.getTextInputValue('suggestion_link') || 'Aucun lien'; const reason = interaction.fields.getTextInputValue('suggestion_reason');
      const sc = await client.channels.fetch(GAME_SUGGESTION_REQUEST_CHANNEL_ID);
      await sc.send({ content: '<@&' + STAFF_ROLE_ID + '> <@&' + GAME_SUGGESTION_NOTICE_ROLE_ID + '>', embeds: [new EmbedBuilder().setTitle('💡 Nouvelle suggestion de jeu').setThumbnail(interaction.user.displayAvatarURL()).addFields({ name: '👤 Demandeur', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🎮 Jeu', value: gn }, { name: '🔗 Lien', value: link }, { name: '📝 Pourquoi ?', value: reason }).setColor('#7A00FF').setFooter({ text: 'Demandeur ID: ' + interaction.user.id }).setTimestamp()], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('game_suggestion_accept').setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('game_suggestion_refuse').setLabel('Refuser').setEmoji('❌').setStyle(ButtonStyle.Danger))] });
      return interaction.reply({ content: '✅ Suggestion envoyée au staff.', ephemeral: true });
    }
    if (interaction.customId !== 'partner_modal') return;
    const sn = interaction.fields.getTextInputValue('partner_server_name'); const mb = interaction.fields.getTextInputValue('partner_members'); const inv = interaction.fields.getTextInputValue('partner_invite'); const desc = interaction.fields.getTextInputValue('partner_description');
    const pc2 = await client.channels.fetch(PARTNER_REQUEST_CHANNEL_ID);
    await pc2.send({ content: '<@&' + STAFF_ROLE_ID + '>', embeds: [new EmbedBuilder().setTitle('🤝 Nouvelle demande de partenariat').setThumbnail(interaction.user.displayAvatarURL()).addFields({ name: '👤 Demandeur', value: interaction.user.tag + ' (' + interaction.user.id + ')' }, { name: '🏷️ Nom serveur', value: sn }, { name: '👥 Membres', value: mb, inline: true }, { name: '🔗 Lien', value: inv }, { name: '📝 Description', value: desc }).setColor('#7A00FF').setFooter({ text: 'Demandeur ID: ' + interaction.user.id }).setTimestamp()], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('partner_accept').setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('partner_refuse').setLabel('Refuser').setEmoji('❌').setStyle(ButtonStyle.Danger))] });
    return interaction.reply({ content: '✅ Demande de partenariat envoyée au staff.', ephemeral: true });
  }
});
// ===== FAKE RECEIPT ENDPOINT =====
app2.get('/api/fake-receipt', async (req, res) => {
  const userId = req.query.userId;
  const montant = parseFloat(req.query.montant);
  const description = req.query.description || 'Prestation de services';
  if (!userId || !montant) return res.send('Paramètres manquants.');
  const date = new Date().toLocaleDateString('fr-FR');
  const id = 'FAK-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  const types = ['Facture', 'Reçu', 'Avoir', "Note d'honoraires"];
  const type = types[Math.floor(Math.random() * types.length)];
  const clients = ['Client Anonyme', 'Société Durand SAS', 'Cabinet Lambert', 'Entreprise Moreau', 'SARL Leclerc'];
  const client = clients[Math.floor(Math.random() * clients.length)];
  const cats = ['Prestation', 'Conseil', 'Honoraires', 'Services', 'Fournitures'];
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const params = new URLSearchParams({ montant, description, type, id, date, client, categorie: cat, qte: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 1 });
  const url = 'https://compta-rp.vercel.app/justificatif.html?' + params;
  try {
    const user = await client.users.fetch(userId);
    await user.send({ embeds: [new EmbedBuilder().setTitle('📄 Votre justificatif').setDescription('**' + type + '** • ' + id + '\n\nMontant : **' + montant.toFixed(2) + ' $**\n' + description + '\n' + client + '\n' + date).setURL(url).setColor('#e67e22')] });
    res.redirect(url);
  } catch (err) {
    res.send("Erreur envoi MP. Vérifie que le bot peut te DM.");
  }
});
const FAKE_PORT = process.env.FAKE_PORT || 3001;
app2.listen(FAKE_PORT, () => console.log('📄 endpoint justificatif sur port ' + FAKE_PORT));
client.login(process.env.TOKEN);
