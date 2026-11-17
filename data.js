// Diamondverse — game data. Edit numbers here to rebalance; engine.js reads everything from DV.
const DV = {};

DV.STAT_LABEL = { hp:'HP', mp:'MP', atk:'ATK', mag:'MAG', def:'DEF', spd:'SPD', crit:'CRIT %' };

// Attribute points: 3 per level. Each point converts into combat stats.
DV.ATTRS = {
  str:{ name:'Strength',  gives:{ atk:2 },            note:'+2 ATK' },
  int:{ name:'Intellect', gives:{ mag:2 },            note:'+2 MAG' },
  vit:{ name:'Vitality',  gives:{ hp:12, def:0.5 },   note:'+12 HP, +0.5 DEF' },
  agi:{ name:'Agility',   gives:{ spd:1, crit:0.5 },  note:'+1 SPD, +0.5 CRIT' },
  spi:{ name:'Spirit',    gives:{ mp:8, mag:0.5 },    note:'+8 MP, +0.5 MAG' }
};

// ---------- Combat classes ----------
DV.CLASSES = {
  assassin:{ name:'Assassin', role:'Burst · Crits · Poison', weapon:'Daggers', main:'atk', color:'#b07cff',
    desc:'Strikes first and leaves nothing standing. Fragile, fast, and lethal on critical hits.',
    base:{hp:90,mp:40,atk:14,mag:5,def:6,spd:16,crit:18}, grow:{hp:9,mp:4,atk:3,mag:1,def:1.2,spd:1.5,crit:.4} },
  guardian:{ name:'Guardian', role:'Shields · Stuns · Counter', weapon:'Bastion Blade', main:'atk', color:'#5fb3ff',
    desc:'A living wall. Converts defense into damage and outlasts anything the gods throw.',
    base:{hp:150,mp:30,atk:10,mag:4,def:16,spd:7,crit:5}, grow:{hp:16,mp:3,atk:2,mag:1,def:3,spd:.6,crit:.1} },
  warrior:{ name:'Warrior', role:'Cleave · Rage · Lifesteal', weapon:'Greatsword', main:'atk', color:'#ff7a59',
    desc:'Heavy steel and heavier swings. Hits every enemy at once and drinks their strength.',
    base:{hp:125,mp:30,atk:15,mag:3,def:11,spd:10,crit:10}, grow:{hp:13,mp:3,atk:3.2,mag:.5,def:2,spd:1,crit:.2} },
  mage:{ name:'Mage', role:'Elements · AoE · Control', weapon:'Staff', main:'mag', color:'#3fd6c6',
    desc:'Bends fire, frost and raw prism-light. Huge area damage, thin robes.',
    base:{hp:80,mp:80,atk:4,mag:17,def:5,spd:10,crit:8}, grow:{hp:8,mp:8,atk:.8,mag:3.5,def:1,spd:1,crit:.2} },
  priest:{ name:'Priest', role:'Heals · Wards · Holy', weapon:'Scepter', main:'mag', color:'#ffd166',
    desc:'Channels the goddess directly. Heals, shields and smites with holy light.',
    base:{hp:95,mp:70,atk:6,mag:13,def:8,spd:9,crit:6}, grow:{hp:10,mp:7,atk:1,mag:2.6,def:1.5,spd:.9,crit:.15} }
};
DV.CLASS_ORDER = ['assassin','guardian','warrior','mage','priest'];

// Secondary class: unlocks at Lv 10 after purifying Prismara's god. Grants that class's skills + 25% of its growth.
DV.SECONDARY = { level:10, world:1, growthShare:.25 };
DV.DUAL_TITLES = {
  'assassin+guardian':'Shadow Warden', 'assassin+mage':'Hexblade', 'assassin+priest':'Penitent Blade',
  'assassin+warrior':'Reaver', 'guardian+mage':'Runeward', 'guardian+priest':'Paladin',
  'guardian+warrior':'Bulwark Knight', 'mage+priest':'Oracle', 'mage+warrior':'Spellsword', 'priest+warrior':'Crusader'
};

// ---------- Skills ----------
// kind: hit | multi | aoe | heal (lowest-HP ally) | healAll | shield (self) | shieldAll | buff | revive | haste (act again)
// stat: atk | mag | def | main (the user's main stat).  Extras: dot, stun, lifesteal, execute, debuff, buff (party:true = whole party),
//   healPct (caster heals % max HP), critBonus, defScale, taunt (turns enemies focus the user), pierce (ignore % of DEF), revive (% HP)
// Each rank above 1 adds +15% power (max rank 5; rank r → r+1 costs r skill points). MP cost grows with level: mp × (1 + level/40).
// Class skills unlock by hero level (lvl). Hidden skills (hidden:true) are learned by reading a realm's hidden story.
DV.SKILLS = {
  a1:{cls:'assassin',name:'Shadow Strike',lvl:1,mp:6,cd:0,kind:'hit',pow:1.6,stat:'atk',critBonus:20,desc:'Single strike, +20% crit chance.'},
  a2:{cls:'assassin',name:'Venom Fang',lvl:3,mp:10,cd:2,kind:'hit',pow:1.0,stat:'atk',dot:{pct:.35,turns:3},desc:'Hit and poison for 3 turns.'},
  a3:{cls:'assassin',name:'Phantom Flurry',lvl:6,mp:16,cd:3,kind:'multi',hits:4,pow:.6,stat:'atk',desc:'Four rapid hits on one target.'},
  a4:{cls:'assassin',name:'Death Mark',lvl:10,mp:24,cd:5,kind:'hit',pow:3.2,stat:'atk',execute:1,desc:'Massive strike. Double damage under 30% HP.'},
  a5:{cls:'assassin',name:'Smoke Veil',lvl:20,mp:18,cd:4,kind:'buff',buff:{stat:'crit',amt:.8,turns:3},desc:'+80% crit chance for 3 turns.'},
  a6:{cls:'assassin',name:'Thousand Cuts',lvl:40,mp:30,cd:3,kind:'multi',hits:7,pow:.45,stat:'atk',pierce:.3,desc:'Seven hits that ignore 30% DEF.'},
  a7:{cls:'assassin',name:'Shadow Step',lvl:70,mp:26,cd:4,kind:'hit',pow:2.2,stat:'atk',haste:1,desc:'Strike, then act again immediately.'},
  a8:{cls:'assassin',name:'Eclipse Execution',lvl:110,mp:44,cd:6,kind:'aoe',pow:2.6,stat:'atk',execute:1,desc:'Hit all foes; double damage under 30% HP.'},
  g1:{cls:'guardian',name:'Shield Bash',lvl:1,mp:5,cd:1,kind:'hit',pow:1.2,stat:'atk',stun:.35,desc:'Hit with a 35% stun chance.'},
  g2:{cls:'guardian',name:'Diamond Bulwark',lvl:3,mp:10,cd:3,kind:'shield',pow:4,stat:'def',desc:'Gain a shield scaled by DEF.'},
  g3:{cls:'guardian',name:'Retribution',lvl:6,mp:14,cd:2,kind:'hit',pow:1.0,stat:'atk',defScale:1.5,desc:'Strike using ATK plus 150% DEF.'},
  g4:{cls:'guardian',name:'Aegis of Dawn',lvl:10,mp:22,cd:5,kind:'buff',buff:{stat:'def',amt:.6,turns:3},healPct:.2,desc:'+60% DEF for 3 turns, heal 20% HP.'},
  g5:{cls:'guardian',name:'Taunting Roar',lvl:20,mp:16,cd:4,kind:'shield',pow:2,stat:'def',taunt:3,desc:'Draw all attacks for 3 turns and gain a shield.'},
  g6:{cls:'guardian',name:'Shield Wall',lvl:40,mp:30,cd:5,kind:'shieldAll',pow:2.5,stat:'def',desc:'Shield the whole party, scaled by DEF.'},
  g7:{cls:'guardian',name:'Earthshatter',lvl:70,mp:34,cd:4,kind:'aoe',pow:1.6,stat:'atk',defScale:1.2,stun:.3,desc:'Hit all foes with ATK + DEF; 30% stun.'},
  g8:{cls:'guardian',name:'Immovable',lvl:110,mp:40,cd:6,kind:'buff',buff:{stat:'def',amt:1,turns:4},healPct:.3,desc:'Double DEF for 4 turns, heal 30% HP.'},
  w1:{cls:'warrior',name:'Cleave',lvl:1,mp:6,cd:0,kind:'aoe',pow:1.2,stat:'atk',desc:'Hits every enemy.'},
  w2:{cls:'warrior',name:'War Cry',lvl:3,mp:10,cd:4,kind:'buff',buff:{stat:'atk',amt:.4,turns:3},desc:'+40% ATK for 3 turns.'},
  w3:{cls:'warrior',name:'Blood Rend',lvl:6,mp:14,cd:2,kind:'hit',pow:1.9,stat:'atk',lifesteal:.3,desc:'Heavy hit, heal 30% of damage.'},
  w4:{cls:'warrior',name:'Titan Breaker',lvl:10,mp:24,cd:5,kind:'hit',pow:3.4,stat:'atk',debuff:{stat:'def',amt:.4,turns:3},desc:'Crushing blow, −40% enemy DEF.'},
  w5:{cls:'warrior',name:'Whirlwind',lvl:20,mp:20,cd:2,kind:'aoe',pow:1.7,stat:'atk',lifesteal:.15,desc:'Spin through all foes, heal 15% of damage.'},
  w6:{cls:'warrior',name:'Battle Hymn',lvl:40,mp:28,cd:5,kind:'buff',buff:{stat:'atk',amt:.35,turns:3,party:true},desc:'+35% ATK to the whole party for 3 turns.'},
  w7:{cls:'warrior',name:'Executioner',lvl:70,mp:32,cd:4,kind:'hit',pow:3.6,stat:'atk',execute:1,desc:'Huge strike; double damage under 30% HP.'},
  w8:{cls:'warrior',name:'Ragnarok',lvl:110,mp:48,cd:6,kind:'aoe',pow:3.2,stat:'atk',debuff:{stat:'def',amt:.3,turns:3},desc:'Shatter all foes, −30% DEF.'},
  m1:{cls:'mage',name:'Arcane Bolt',lvl:1,mp:6,cd:0,kind:'hit',pow:1.5,stat:'mag',desc:'Bolt of raw prism-light.'},
  m2:{cls:'mage',name:'Ember Storm',lvl:3,mp:14,cd:2,kind:'aoe',pow:1.1,stat:'mag',dot:{pct:.25,turns:2},desc:'Burn every enemy.'},
  m3:{cls:'mage',name:'Frost Prison',lvl:6,mp:16,cd:3,kind:'hit',pow:1.4,stat:'mag',stun:1,desc:'Freeze the target for a turn.'},
  m4:{cls:'mage',name:'Prism Nova',lvl:10,mp:30,cd:5,kind:'aoe',pow:2.8,stat:'mag',desc:'Detonate all light in the field.'},
  m5:{cls:'mage',name:'Chain Lightning',lvl:20,mp:22,cd:2,kind:'aoe',pow:1.5,stat:'mag',stun:.2,desc:'Arc through all foes; 20% stun.'},
  m6:{cls:'mage',name:'Arcane Barrier',lvl:40,mp:30,cd:5,kind:'shieldAll',pow:2.2,stat:'mag',desc:'Shield the whole party, scaled by MAG.'},
  m7:{cls:'mage',name:'Meteor',lvl:70,mp:40,cd:4,kind:'aoe',pow:3,stat:'mag',dot:{pct:.3,turns:3},desc:'Crush all foes and leave them burning.'},
  m8:{cls:'mage',name:'Time Stop',lvl:110,mp:50,cd:7,kind:'aoe',pow:1.5,stat:'mag',stun:1,desc:'Hit and freeze every foe for a turn.'},
  p1:{cls:'priest',name:'Holy Smite',lvl:1,mp:6,cd:0,kind:'hit',pow:1.4,stat:'mag',desc:'Holy damage to one enemy.'},
  p2:{cls:'priest',name:'Mending Light',lvl:3,mp:12,cd:2,kind:'heal',pow:2.4,stat:'mag',desc:'Heal the most wounded ally.'},
  p3:{cls:'priest',name:'Sanctuary',lvl:6,mp:16,cd:4,kind:'shieldAll',pow:2,stat:'mag',desc:'Holy shield on the whole party.'},
  p4:{cls:'priest',name:'Judgment of Facets',lvl:10,mp:26,cd:5,kind:'aoe',pow:2.2,stat:'mag',healPct:.15,desc:'Smite all, heal 15% HP.'},
  p5:{cls:'priest',name:'Prayer of Light',lvl:20,mp:24,cd:3,kind:'healAll',pow:1.6,stat:'mag',desc:'Heal the whole party.'},
  p6:{cls:'priest',name:'Resurrection',lvl:40,mp:36,cd:6,kind:'revive',revive:.5,stat:'mag',desc:'Revive a fallen ally at 50% HP.'},
  p7:{cls:'priest',name:'Divine Shield',lvl:70,mp:40,cd:5,kind:'shieldAll',pow:3,stat:'mag',cleanse:1,desc:'Large party shield; removes poison.'},
  p8:{cls:'priest',name:'Miracle',lvl:110,mp:56,cd:7,kind:'healAll',pow:3.2,stat:'mag',revive:.3,desc:'Heal everyone and revive the fallen at 30%.'},
  // Hidden skills — any class. Learned from hidden stories (see realm lore).
  h1:{hidden:true,name:'Chime Rhythm',mp:14,cd:4,kind:'buff',buff:{stat:'spd',amt:.3,turns:3,party:true},stat:'main',desc:'+30% SPD to the whole party.'},
  h2:{hidden:true,name:'Undertow Hymn',mp:20,cd:3,kind:'healAll',pow:1.4,stat:'main',desc:'Heal the whole party.'},
  h3:{hidden:true,name:'Name the Dread',mp:18,cd:4,kind:'aoe',pow:.8,stat:'main',stun:.5,desc:'Hit all foes; 50% stun.'},
  h4:{hidden:true,name:'Heartwood Drain',mp:16,cd:2,kind:'hit',pow:1.8,stat:'main',lifesteal:.5,desc:'Heal 50% of the damage dealt.'},
  h5:{hidden:true,name:'Rime Armor',mp:22,cd:4,kind:'shieldAll',pow:2,stat:'main',desc:'Ice shield on the whole party.'},
  h6:{hidden:true,name:'Gift of Giving',mp:14,cd:2,kind:'heal',pow:2.6,stat:'main',desc:'Big heal on the most wounded ally.'},
  h7:{hidden:true,name:'The Last Door',mp:30,cd:6,kind:'revive',revive:.6,stat:'main',desc:'Revive a fallen ally at 60% HP.'},
  h8:{hidden:true,name:'Rift Tear',mp:28,cd:3,kind:'aoe',pow:2.2,stat:'main',debuff:{stat:'def',amt:.3,turns:3},desc:'Tear space through all foes, −30% DEF.'},
  h9:{hidden:true,name:'Purging Flame',mp:20,cd:3,kind:'hit',pow:1.6,stat:'main',dot:{pct:.5,turns:4},cleanse:1,desc:'Burn a foe for 4 turns; cure your party of poison.'},
  h10:{hidden:true,name:'Breath Between',mp:24,cd:5,kind:'haste',stat:'main',desc:'Act again immediately.'},
  h11:{hidden:true,name:'Pressure Ward',mp:30,cd:5,kind:'shieldAll',pow:2.8,stat:'main',desc:'Heavy shield on the whole party.'},
  h12:{hidden:true,name:'Starfall',mp:36,cd:4,kind:'aoe',pow:3,stat:'main',desc:'Call down a star on every foe.'},
  h13:{hidden:true,name:'One Beat Ahead',mp:24,cd:5,kind:'buff',buff:{stat:'crit',amt:.6,turns:3,party:true},desc:'+60% crit to the whole party.',stat:'main'},
  h14:{hidden:true,name:'Shared Light',mp:28,cd:4,kind:'healAll',pow:2,stat:'main',mpGift:.15,desc:'Heal the party and restore 15% of their MP.'},
  h15:{hidden:true,name:'The Final Sentence',mp:40,cd:6,kind:'hit',pow:5,stat:'main',execute:1,desc:'Enormous strike; double damage under 30% HP.'},
  h16:{hidden:true,name:'Hive Mend',mp:34,cd:4,kind:'healAll',pow:3,stat:'main',desc:'Large heal on the whole party.'},
  h17:{hidden:true,name:'Gate Strike',mp:32,cd:3,kind:'multi',hits:5,pow:.9,stat:'main',pierce:.5,desc:'Five strikes that ignore 50% DEF.'},
  h18:{hidden:true,name:'Remembrance',mp:60,cd:7,kind:'aoe',pow:4,stat:'main',healPct:.2,desc:'Devastate all foes and heal 20% HP.'}
};
DV.LOADOUT_MAX = 6;

// ---------- Companions ----------
// Recruitable party members. join: 'story' (after realm `from` is saved) or 'hidden' (find them at marks[mark] in realm `from`).
// Companions match the hero's level, use their class skills plus a signature skill, and receive 60% of the hero's gear stats.
// Bond rises with battles won together (DV.BOND_WINS); each bond level opens a chapter of their story and a permanent boost.
DV.PARTY_MAX = 2;
DV.BOND_WINS = [8, 25, 50];
DV.COMPANIONS = {
  mira:{ look:{sex:1,race:0,skin:1,hair:3,eyes:4,outfit:2,hairStyle:3,physique:1,height:1}, name:'Mira', cls:'guardian', from:1, join:'story', species:'Prismari farmer', mul:{hp:1.1,def:1.1},
    sig:{name:'Harvest Ward',mp:14,cd:4,kind:'shieldAll',pow:2,stat:'def',desc:'Shield the party with packed earth and glass wheat.'},
    bio:'A farmer who replanted a god\'s fields and then followed the one who saved them.',
    story:['Mira tells you about her brother, taken by the black roots. She never found him.','In Verdant Maw, Mira finds Prismari glass-seed growing wild. Her brother passed through here, alive.','A letter at last: her brother farms in Aurora Steppe. Mira cries, laughs, and sharpens her pitchfork anyway.'] },
  brann:{ look:{sex:0,race:4,skin:5,hair:9,eyes:1,outfit:3,hairStyle:10,physique:2,height:0}, name:'Brann', cls:'warrior', from:2, join:'story', species:'Emberkin smith', mul:{atk:1.1,hp:1.05},
    sig:{name:'Quench-Oath Strike',mp:18,cd:3,kind:'hit',pow:2.6,stat:'atk',debuff:{stat:'def',amt:.25,turns:3},desc:'A blow sworn on his honor. −25% DEF.'},
    bio:'A smith who kept his forge cold for nine years rather than make weapons for a tyrant.',
    story:['Brann admits he once forged a blade for Pyrrhos. He has been trying to unmake it ever since.','In Brassmoor, Brann finds that blade for sale. He buys it with every coin he has.','Brann reforges the blade into a plough and gives it to Mira. He sleeps soundly for the first time in years.'] },
  isla:{ look:{sex:1,race:1,skin:10,hair:7,eyes:6,outfit:0,hairStyle:1,physique:0,height:1}, name:'Isla', cls:'mage', from:3, join:'hidden', mark:1, species:'Merrow tide-singer', mul:{mag:1.1,mp:1.1},
    sig:{name:'Tidecall',mp:20,cd:3,kind:'aoe',pow:1.8,stat:'mag',stun:.25,desc:'A crushing wave over every foe.'},
    bio:'A Merrow who hid in the Drowned Lighthouse keeping the last verse of the tide-song alive.',
    story:['Isla teaches you her family verse. It is about a lighthouse keeper who loved the sea.','Isla learns the keeper of the Drowned Lighthouse was human. Her great-grandmother.','In Tidecall Shoals, Isla sings the full tide-song for the first time in a century. Two oceans answer.'] },
  riku:{ look:{sex:1,race:2,skin:2,hair:5,eyes:1,outfit:4,hairStyle:6,physique:1,height:0}, name:'Riku', cls:'assassin', from:4, join:'story', species:'Aerin skyferry pilot', mul:{spd:1.15,crit:1.1},
    sig:{name:'Skydive',mp:16,cd:3,kind:'hit',pow:2.4,stat:'atk',critBonus:30,desc:'Plunge from above; +30% crit.'},
    bio:'A skyferry pilot who ran the Tempest Queen\'s blockade every night for passengers who could not pay.',
    story:['Riku confesses she never did her first flight. She was too scared and has hidden it ever since.','On Skyglass Sea, Riku leaps from a cloud-whale without a ferry. She flies.','Riku teaches a class of Nimbari children to fly. She is terrible at being serious about it.'] },
  talo:{ look:{sex:0,race:1,skin:8,hair:4,eyes:0,outfit:5,hairStyle:5,physique:0,height:2}, name:'Talo Venn', cls:'mage', from:7, join:'story', species:'Quorin gate-engineer', mul:{mag:1.12},
    sig:{name:'Phase Lock',mp:22,cd:4,kind:'aoe',pow:1.4,stat:'mag',debuff:{stat:'def',amt:.35,turns:3},desc:'Out-of-phase every foe. −35% DEF.'},
    bio:'A Quorin engineer who believes science and faith are two instruments playing one song.',
    story:['Talo shows you his star. He has measured it every night since childhood. It is slowly dimming.','Talo realizes his star dims whenever a realm falls to Rot. It is a resonance gauge for the Lattice.','His star blazes after Nihil\'s Threshold. Talo names it after you and refuses to discuss it.'] },
  kesh:{ look:{sex:0,race:3,skin:4,hair:1,eyes:1,outfit:7,hairStyle:2,physique:1,height:1}, name:'Kesh', cls:'assassin', from:9, join:'hidden', mark:1, species:'Dunemar navigator', mul:{atk:1.1,spd:1.1},
    sig:{name:'Sand-Song Ambush',mp:18,cd:3,kind:'multi',hits:3,pow:.9,stat:'atk',stun:.3,desc:'Three strikes from the dunes; may stun.'},
    bio:'A Dunemar navigator who vanished into the Sunken Sundial chasing the Mirage Tyrant alone.',
    story:['Kesh owes a water-debt to Ezzi. He thinks he can never pay it.','Kesh learns Ezzi forgave the debt years ago and never told him, to keep him coming home.','Kesh brings Ezzi a cup of water from every realm you visit. Fifty cups.'] },
  hrolf:{ look:{sex:0,race:0,skin:2,hair:4,eyes:6,outfit:4,hairStyle:9,physique:3,height:2}, name:'Hrolf', cls:'guardian', from:10, join:'story', species:'Hrimfolk giant', mul:{hp:1.2,def:1.05},
    sig:{name:'Hearth Guard',mp:16,cd:4,kind:'shield',pow:3,stat:'def',taunt:2,desc:'Plant himself in front of everyone. Draws attacks.'},
    bio:'A giant who never refuses anyone a seat at his fire, including enemies.',
    story:['Hrolf has carved every name of everyone he has fed. The list is enormous.','In Ashen Remnant, Hrolf finds a hearth with no fire and lights it. A Last Ember weeps.','Hrolf adds your name to his list, and then, carefully, Lumeria\'s.'] },
  seven:{ look:{sex:0,race:4,skin:9,hair:11,eyes:0,outfit:7,hairStyle:10,physique:3,height:0}, name:'Seven', cls:'guardian', from:11, join:'hidden', mark:1, species:'Cogborn unit', mul:{def:1.2},
    sig:{name:'Overclock',mp:18,cd:5,kind:'buff',buff:{stat:'spd',amt:.4,turns:3,party:true},desc:'Overclock the party. +40% SPD.'},
    bio:'A small Cogborn unit lost in the Scrapyard Maze who decided you are its new Winding Day partner.',
    story:['Seven asks what organics dream about. You tell it. It writes everything down.','Seven dreams for the first time, in Dreamreach. It dreams of being wound by you.','Seven winds your heart-spring on Winding Day. You do not have one. It does it anyway.'] },
  calavera:{ look:{sex:1,race:0,skin:0,hair:4,eyes:2,outfit:6,hairStyle:11,physique:0,height:1}, name:'Sister Calavera', cls:'priest', from:16, join:'story', species:'Ossuar monk', mul:{mag:1.08,hp:1.05},
    sig:{name:'Bone-Read Blessing',mp:22,cd:4,kind:'healAll',pow:1.8,stat:'mag',desc:'The ancestors mend the party.'},
    bio:'A skeletal monk who decided the living needed her more than the dead.',
    story:['Calavera reads your knuckles. She says you have two lives\' worth of endings. She is fine with it.','Calavera meets Mortessa\'s opposite, Phenra, and they argue happily for an hour.','Calavera gives you one of her finger bones, so the ancestors can find you if you are lost.'] },
  ysra:{ look:{sex:1,race:1,skin:8,hair:8,eyes:3,outfit:1,hairStyle:4,physique:0,height:1}, name:'Ysra', cls:'assassin', from:17, join:'hidden', mark:2, species:'Arachnae weaver', mul:{atk:1.08,crit:1.15},
    sig:{name:'Silk Garrote',mp:20,cd:3,kind:'hit',pow:2,stat:'atk',dot:{pct:.5,turns:3},stun:.4,desc:'Bind and bleed a foe.'},
    bio:'A weaver who went to mend the Snapped Bridge alone and stayed to hold it together with her own silk.',
    story:['Ysra weaves a thread-contract with you: to tell each other only the truth.','Ysra admits she cut her sister\'s thread-contract once. She has never forgiven herself.','Thessaly reweaves the contract with Ysra. They are sisters again.'] },
  nimra:{ look:{sex:1,race:2,skin:1,hair:9,eyes:1,outfit:5,hairStyle:1,physique:0,height:0}, name:'Nimra', cls:'priest', from:24, join:'hidden', mark:2, species:'Vulpari tea-priestess', mul:{mag:1.1,spd:1.05},
    sig:{name:'Ninefold Tea',mp:20,cd:3,kind:'healAll',pow:1.5,stat:'mag',mpGift:.1,desc:'Heal the party and restore 10% MP.'},
    bio:'A fox-priestess who broke a tea-vow to fight the Wilting Herald, and fled in shame.',
    story:['Nimra has eight tails. The ninth was lost to her broken vow.','Saiko\'s message reaches Nimra: a vow broken to save others is kept in spirit.','Nimra pours tea for you properly. Her ninth tail grows back while she does.'] },
  vask:{ look:{sex:0,race:3,skin:9,hair:0,eyes:3,outfit:3,hairStyle:7,physique:2,height:2}, name:'Vask', cls:'warrior', from:27, join:'story', species:'Gor\'Khan warlord', mul:{atk:1.15},
    sig:{name:'Scar-Gift',mp:20,cd:4,kind:'buff',buff:{stat:'atk',amt:.4,turns:3,party:true},healPct:.1,desc:'War-shout. +40% ATK to the whole party.'},
    bio:'A warlord who wanted to see the realms and found the perfect excuse.',
    story:['Vask challenges you to a duel every morning. You win every time. He is delighted.','Vask meets Brann. They arm-wrestle for six hours. Neither will say who won.','Vask gives you the first blow in a fight with him. That is the highest honor of his people.'] },
  ember:{ look:{sex:1,race:3,skin:3,hair:9,eyes:1,outfit:3,hairStyle:9,physique:1,height:1}, name:'Ember', cls:'mage', from:29, join:'story', species:'Cindrel phoenix', mul:{mag:1.1,hp:1.05},
    sig:{name:'Rebirth Flame',mp:26,cd:6,kind:'revive',revive:.5,stat:'mag',desc:'Revive a fallen ally in fire at 50% HP.'},
    bio:'A phoenix who has burned once and been reborn, and is impatient to see everything before the next time.',
    story:['Ember tells you she remembers her past life. She was a librarian. She hated it.','In The Unwritten, Ember finds her own old library card. She laughs until she smokes.','Ember gives you her ash-gift early. She says she does not plan to wait for another rebirth to do it.'] },
  kael:{ look:{sex:0,race:1,skin:7,hair:0,eyes:2,outfit:6,hairStyle:1,physique:0,height:2}, name:"Kael'thar", cls:'mage', from:33, join:'hidden', mark:2, species:'Penitent god', mul:{mag:1.15,mp:1.1},
    sig:{name:'Obsidian Penance',mp:30,cd:4,kind:'aoe',pow:2.4,stat:'mag',pierce:.4,desc:'Shards of his old throne strike every foe.'},
    bio:'The Eldest Facet who broke the Heart, now a hooded wanderer mending what the Rot breaks.',
    story:["Kael'thar will not speak to Lumeria. She does not ask him to.","Kael'thar tells you what Nihilus promised him: no more wars between the facets. He believed it.","Kael'thar and Lumeria sit together at the edge of the Hollow Heart. Neither speaks. Neither leaves."] },
  tock:{ look:{sex:0,race:4,skin:3,hair:4,eyes:5,outfit:7,hairStyle:5,physique:3,height:0}, name:'Old Tock', cls:'guardian', from:37, join:'hidden', mark:1, species:'Chronari watchmaker', mul:{def:1.1,spd:1.1},
    sig:{name:'Rewind',mp:24,cd:5,kind:'healAll',pow:1.6,stat:'def',desc:'Rewind the party\'s wounds a few seconds.'},
    bio:'A watchmaker stuck in a loop for forty years, now very keen to catch up on everything.',
    story:['Tock asks who won a war that ended thirty years ago. You do not know. He is fascinated.','Tock fixes Seven\'s escapement. Seven follows him for a week.','Tock builds you a watch that runs at your own pace. He says it is the only honest clock.'] },
  seraphine:{ look:{sex:1,race:1,skin:0,hair:3,eyes:5,outfit:5,hairStyle:1,physique:1,height:2}, name:'Seraphine', cls:'priest', from:44, join:'story', species:'Seraph', mul:{mag:1.12,hp:1.1},
    sig:{name:'Wing-Vow',mp:28,cd:5,kind:'shieldAll',pow:3,stat:'mag',desc:'Six wings over the party. Large shield.'},
    bio:'A seraph who lost half her choir to the Rot and swore a feather-vow to the Facetborn.',
    story:['Seraphine visits her fallen sisters\' graves before every battle.','Seraphine sings with the Hollow Choir\'s freed voices in Nihil\'s Threshold. Some of them were her sisters.','Seraphine gives Lumeria a feather. A god, protected by an angel. Lumeria laughs for the first time in an age.'] }
};

// ---------- Job classes ----------
// Jobs give passive perks. Every modifier key is an additive bonus, merged with blessings and mastery bonuses in engine.js:
//   hp/mp/atk/mag/def/spd: +% stat · critFlat: +CRIT · all: +% every stat · regen: % max HP healed per turn
//   gold/xp/drop: +% rewards · rarityUp: rarity steps on drops · dia: Diamonds per win · feast: +% ATK/MAG for 3 turns at battle start
//   potionPow: +% potion strength · potUses: extra potions per battle · mpCostCut: −% skill MP cost · shopCut: −% Bazaar prices
//   upCostCut: −% upgrade gold · upRate: +success at +5 and above · safeTo: upgrades below this + never fail
//   armorGear: +% stats from helm & armor · salvageBonus: +% salvage shards · harvest/catch: chance of a Tonic/Mana Shard after a win
// A job reaching Lv 5 is Mastered: its mastery bonus stays active forever, even after switching jobs.
DV.JOB_TIERS = [
  { id:1, name:'Tier 1 · Trade jobs', note:'Always available. Your first job is free.' },
  { id:2, name:'Tier 2 · Advanced jobs', note:'Unlock by meeting the requirements, then paying Diamonds once.' },
  { id:3, name:'Luxury jobs', note:'Premium jobs bought in the Diamond Store.' }
];
DV.JOBS = {
  // Tier 1
  blacksmith:{tier:1,name:'Blacksmith',perk:'Forge upgrades cost 20% less gold. +5% success at +5 and above.',
    mods:{upCostCut:.2,upRate:.05}, mastery:{text:'+3% ATK',mods:{atk:.03}}},
  tailor:{tier:1,name:'Tailor',perk:'Helms and armor give 20% more stats. Salvage gives 50% more shards.',
    mods:{armorGear:.2,salvageBonus:.5}, mastery:{text:'+3% DEF',mods:{def:.03}}},
  hunter:{tier:1,name:'Hunter',perk:'+20% gold and +10% gear drop chance.',
    mods:{gold:.2,drop:.1}, mastery:{text:'+2 CRIT',mods:{critFlat:2}}},
  fisher:{tier:1,name:'Fisher',perk:'+15% max MP. 30% chance to reel in a Mana Shard after each win.',
    mods:{mp:.15,catch:.3}, mastery:{text:'+5% max MP',mods:{mp:.05}}},
  farmer:{tier:1,name:'Farmer',perk:'+12% max HP. 30% chance to harvest a Facet Tonic after each win.',
    mods:{hp:.12,harvest:.3}, mastery:{text:'+5% max HP',mods:{hp:.05}}},
  chef:{tier:1,name:'Chef',perk:'Start every battle with +15% ATK and MAG for 3 turns.',
    mods:{feast:.15}, mastery:{text:'+2% ATK and MAG',mods:{atk:.02,mag:.02}}},
  // Tier 2 — req types: {job, lv} job level · {anyJob:[...], lv} · {level} hero level · {world} worlds purified · {gold} lifetime gold
  doctor:{tier:2,name:'Doctor',cost:150,perk:'Potions heal 60% more. +1 potion per battle. Heal 3% HP every turn.',
    req:[{job:'chef',lv:5},{level:10}], mods:{potionPow:.6,potUses:1,regen:.03}, mastery:{text:'Heal 1% HP every turn',mods:{regen:.01}}},
  botanist:{tier:2,name:'Botanist',cost:150,perk:'35% chance each to gather a Facet Tonic and a Mana Shard after wins. Skills cost 10% less MP.',
    req:[{job:'farmer',lv:5},{world:1}], mods:{harvest:.35,catch:.35,mpCostCut:.1}, mastery:{text:'Skills cost 5% less MP',mods:{mpCostCut:.05}}},
  merchant:{tier:2,name:'Merchant',cost:200,perk:'Bazaar prices 20% lower. +30% gold from battles.',
    req:[{anyJob:['hunter','fisher'],lv:5},{gold:3000}], mods:{shopCut:.2,gold:.3}, mastery:{text:'+10% gold',mods:{gold:.1}}},
  // Luxury — real-money purchases. `sku` is the product id used by the store (payments.js); price is display only.
  gemcutter:{tier:3,name:'Royal Gemcutter',sku:'job.gemcutter',price:4.99,perk:'+10% to every stat. Upgrades up to +8 never fail.',
    mods:{all:.10,safeTo:8}, mastery:{text:'+2% to every stat',mods:{all:.02}}},
  gourmand:{tier:3,name:'Celestial Gourmand',sku:'job.gourmand',price:4.99,perk:'Start battles with +25% ATK and MAG for 3 turns. Heal 4% HP every turn. Potions 25% stronger.',
    mods:{feast:.25,regen:.04,potionPow:.25}, mastery:{text:'Heal 1% HP every turn',mods:{regen:.01}}},
  starforger:{tier:3,name:'Starforger',sku:'job.starforger',price:7.99,perk:'Gear drops roll one rarity higher. +15% drop chance.',
    mods:{rarityUp:1,drop:.15}, mastery:{text:'+5% drop chance',mods:{drop:.05}}},
  baron:{tier:3,name:'Diamond Baron',sku:'job.baron',price:9.99,perk:'+50% gold and +5 Diamonds every victory.',
    mods:{gold:.5,dia:5}, mastery:{text:'+10% gold',mods:{gold:.1}}}
};
DV.JOB_SWAP_GOLD = 150;
DV.JOB_XP = [30, 70, 120, 180]; // job XP to go from Lv 1→2, 2→3, 3→4, 4→5 (Mastered)

// ---------- Equipment ----------
DV.SLOTS = ['weapon','helm','armor','charm'];
DV.SLOT_NAME = { weapon:'Weapon', helm:'Helm', armor:'Armor', charm:'Charm' };
DV.RARITY = [
  {id:'common',name:'Common',mult:1,shards:2,color:'#9aa3b5'},
  {id:'rare',name:'Rare',mult:1.35,shards:5,color:'#5fb3ff'},
  {id:'epic',name:'Epic',mult:1.8,shards:12,color:'#b07cff'},
  {id:'legendary',name:'Legendary',mult:2.4,shards:30,color:'#ffc145'},
  {id:'mythic',name:'Mythic',mult:3.2,shards:70,color:'#7ef2ff'}
];
DV.SLOT_BASE = { weapon:{main:9}, helm:{def:3,hp:16,mp:10}, armor:{def:6,hp:32}, charm:{crit:2,spd:2,mp:14} };
// Gear tier = realm number (1–50). Material name changes every 5 tiers.
DV.MATERIAL = ['Dawnglass','Cinderforged','Tidepearl','Stormwoven','Duskveil','Starsteel','Voidglass','Seraphic','Lattice','Diamondheart'];
DV.materialFor = t => DV.MATERIAL[Math.min(DV.MATERIAL.length - 1, Math.floor((t - 1) / 5))];
DV.SLOT_NOUN = { helm:'Circlet', armor:'Cuirass', charm:'Facet Charm' };
// Upgrade: each + adds 10% of base stats. Success rate by current level (index = current +).
DV.UPGRADE = { max:15, rate:[1,1,1,1,1,.9,.8,.7,.6,.5,.42,.35,.3,.25,.2], perLevel:.10 };

// ---------- Worlds & story ----------
// Speaker keys map to portrait colours in the UI.
// Dialogue speakers: 'narr' (no name), 'lumeria', or any display name used directly.
DV.SPEAKERS = { narr:'', lumeria:'Lumeria' };

DV.PROLOGUE = [
  ['narr','Rain. Headlights. A sound like glass breaking, and then nothing.'],
  ['narr','Nothing, until light folds around you in a thousand facets.'],
  ['lumeria','Wake, Facetborn. Your old world has let you go. Mine has need of you.'],
  ['lumeria','I am Lumeria, the Ninth Facet, last of the Radiant who still remembers her own name.'],
  ['lumeria','The Diamond Heart that bound our worlds was shattered. Through the cracks crept the Umbral Rot, and one by one my siblings drank of it.'],
  ['lumeria','Gods of harvest, flame, tide and storm now poison the worlds they swore to keep.'],
  ['lumeria','I cannot strike them. The Rot feeds on divine light. But you were born outside the Verse, and its hunger cannot find you.'],
  ['lumeria','Your old body is gone. Shape a new vessel, and choose the path you will walk.']
];

// Realms live in realms/arc1.js … realms/arc5.js. Each file calls realm({...}) once per realm, in order.
// Fields:
//   name, sub, biome (look of the open world, see realm.js BIOMES), hue
//   people: [species, what they are like]   custom: a tradition of theirs
//   god: { name, pure (title once safe), corrupted: true|false }
//   boss: who waits at the fifth shrine (the corrupted god's avatar, or a Herald of the Rot besieging a free god)
//   guide: who greets you · foes: 4 roaming/stage foes · marks: 4 named landmarks (index 0 is near the start)
//   intro / bossTalk / after: dialogue lines [speaker, text]; speaker 'narr', 'lumeria', or a display name
//   quest: side quest { title, giver, text, goal:['foes',n] | ['mark',i] | ['chests'], reward:{gold,dia,shards}, done }
//   lore: hidden story at landmark marks[i] → { mark, title, text, skill } (skill learned on reading)
//   bless: [stat, amount, name] granted when the realm is saved
//   recruit: companion who joins after the boss · hidden: companion who must be found in this realm
DV.WORLDS = [];
function realm(o) { o.id = DV.WORLDS.length + 1; DV.WORLDS.push(o); return o; }
DV.STAGES_PER_WORLD = 5; // 4 battles + god's avatar
DV.STAGE_NAMES = ['Outskirts','Corrupted Trail','Rot Nest','Inner Sanctum','Avatar of the God'];
DV.ARCS = [
  // bossAtk: per-arc tuning of boss attack (set from playtest results; see tools/sim.js)
  { name:'The Shattered Heart', from:1, bossAtk:1 }, { name:'The Lattice Wars', from:11, bossAtk:1.25 }, { name:'The Hungry Dark', from:21, bossAtk:1.1 },
  { name:'Realms Unbound', from:31, bossAtk:1 }, { name:'The Hollow Heart', from:41, bossAtk:1 }
];
DV.arcOf = w => Math.min(DV.ARCS.length, Math.floor((w - 1) / 10) + 1);

// Hero appearance options
// Hero appearance. Indexes are stored in the save (S.look); new keys default through normLook() in chars.js.
DV.LOOK = {
  sex:['Male','Female'],
  race:[
    { id:'human', name:'Human', text:'Born of your old world. Adaptable, and quietly stubborn.' },
    { id:'elf', name:'Elf', text:'Long-eared and long-lived. Hears the Lattice hum.' },
    { id:'beastkin', name:'Beastkin', text:'Fox or wolf ears and a tail. Senses sharper than steel.' },
    { id:'dragonkin', name:'Dragonkin', text:'Horns, scales at the cheek, a tail. Warm-blooded in every sense.' },
    { id:'dwarf', name:'Dwarf', text:'Short, broad and immovable. Beards optional, grit mandatory.' }
  ],
  skin:['#fde3cf','#f6d7c3','#e8b896','#d9a074','#c68a62','#9a6243','#6b4330','#4a2e22','#d9c4f0','#b8e0d2','#9fb6e0'],
  hair:['#1d1a24','#5b3a29','#c98b4a','#f2e1a6','#e6e8f0','#d24d6b','#4b7bff','#3fd6c6','#8a4bd6','#ff8a3d','#7ad36b','#2c3f73'],
  eyes:['#3fd6c6','#ffc145','#b07cff','#ff5d73','#7ad36b','#e8f4ff','#4b7bff','#8a5a3a'],
  outfit:['#2b3a67','#5a2a4f','#1f4d45','#6b2f2a','#3b3b46','#e8e2d6','#1d1a24','#7a5a1f'],
  hairStyle:['Short','Long','Spiked','Ponytail','Twin tails','Bob','Swept','Mohawk','Braid','Wild mane','Buzz','Hime cut'],
  physique:['Slim','Athletic','Muscular','Heavy'],
  height:['Short','Average','Tall'],
  origin:[
    {id:'student',name:'Night-class Student',bonus:{int:3},text:'+3 Intellect'},
    {id:'medic',name:'Paramedic',bonus:{spi:2,vit:1},text:'+2 Spirit, +1 Vitality'},
    {id:'courier',name:'Bike Courier',bonus:{agi:3},text:'+3 Agility'},
    {id:'athlete',name:'Gym Rat',bonus:{str:2,vit:1},text:'+2 Strength, +1 Vitality'}
  ]
};
