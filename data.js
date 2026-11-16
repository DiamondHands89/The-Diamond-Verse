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
// kind: hit | multi | aoe | heal | shield | buff.  Extras: dot, stun, lifesteal, execute, debuff, buff, healPct, critBonus
// Each rank above 1 adds +15% power. Max rank 5. Upgrading to rank N costs N-1 skill points... (rank r -> r+1 costs r SP)
DV.SKILLS = {
  a1:{cls:'assassin',name:'Shadow Strike',lvl:1,mp:6,cd:0,kind:'hit',pow:1.6,stat:'atk',critBonus:20,desc:'Single strike, +20% crit chance.'},
  a2:{cls:'assassin',name:'Venom Fang',lvl:3,mp:10,cd:2,kind:'hit',pow:1.0,stat:'atk',dot:{pct:.35,turns:3},desc:'Hit and poison for 3 turns.'},
  a3:{cls:'assassin',name:'Phantom Flurry',lvl:6,mp:16,cd:3,kind:'multi',hits:4,pow:.6,stat:'atk',desc:'Four rapid hits on one target.'},
  a4:{cls:'assassin',name:'Death Mark',lvl:10,mp:24,cd:5,kind:'hit',pow:3.2,stat:'atk',execute:1,desc:'Massive strike. Double damage under 30% HP.'},
  g1:{cls:'guardian',name:'Shield Bash',lvl:1,mp:5,cd:1,kind:'hit',pow:1.2,stat:'atk',stun:.35,desc:'Hit with a 35% stun chance.'},
  g2:{cls:'guardian',name:'Diamond Bulwark',lvl:3,mp:10,cd:3,kind:'shield',pow:4,stat:'def',desc:'Gain a shield scaled by DEF.'},
  g3:{cls:'guardian',name:'Retribution',lvl:6,mp:14,cd:2,kind:'hit',pow:1.0,stat:'atk',defScale:1.5,desc:'Strike using ATK plus 150% DEF.'},
  g4:{cls:'guardian',name:'Aegis of Dawn',lvl:10,mp:22,cd:5,kind:'buff',buff:{stat:'def',amt:.6,turns:3},healPct:.2,desc:'+60% DEF for 3 turns, heal 20% HP.'},
  w1:{cls:'warrior',name:'Cleave',lvl:1,mp:6,cd:0,kind:'aoe',pow:1.2,stat:'atk',desc:'Hits every enemy.'},
  w2:{cls:'warrior',name:'War Cry',lvl:3,mp:10,cd:4,kind:'buff',buff:{stat:'atk',amt:.4,turns:3},desc:'+40% ATK for 3 turns.'},
  w3:{cls:'warrior',name:'Blood Rend',lvl:6,mp:14,cd:2,kind:'hit',pow:1.9,stat:'atk',lifesteal:.3,desc:'Heavy hit, heal 30% of damage.'},
  w4:{cls:'warrior',name:'Titan Breaker',lvl:10,mp:24,cd:5,kind:'hit',pow:3.4,stat:'atk',debuff:{stat:'def',amt:.4,turns:3},desc:'Crushing blow, −40% enemy DEF.'},
  m1:{cls:'mage',name:'Arcane Bolt',lvl:1,mp:6,cd:0,kind:'hit',pow:1.5,stat:'mag',desc:'Bolt of raw prism-light.'},
  m2:{cls:'mage',name:'Ember Storm',lvl:3,mp:14,cd:2,kind:'aoe',pow:1.1,stat:'mag',dot:{pct:.25,turns:2},desc:'Burn every enemy.'},
  m3:{cls:'mage',name:'Frost Prison',lvl:6,mp:16,cd:3,kind:'hit',pow:1.4,stat:'mag',stun:1,desc:'Freeze the target for a turn.'},
  m4:{cls:'mage',name:'Prism Nova',lvl:10,mp:30,cd:5,kind:'aoe',pow:2.8,stat:'mag',desc:'Detonate all light in the field.'},
  p1:{cls:'priest',name:'Holy Smite',lvl:1,mp:6,cd:0,kind:'hit',pow:1.4,stat:'mag',desc:'Holy damage to one enemy.'},
  p2:{cls:'priest',name:'Mending Light',lvl:3,mp:12,cd:2,kind:'heal',pow:2.4,stat:'mag',desc:'Heal scaled by MAG.'},
  p3:{cls:'priest',name:'Sanctuary',lvl:6,mp:16,cd:4,kind:'shield',pow:3,stat:'mag',desc:'Holy shield scaled by MAG.'},
  p4:{cls:'priest',name:'Judgment of Facets',lvl:10,mp:26,cd:5,kind:'aoe',pow:2.2,stat:'mag',healPct:.15,desc:'Smite all, heal 15% HP.'}
};
DV.LOADOUT_MAX = 5;

// ---------- Job classes ----------
// Free jobs swap for gold. Luxury jobs stay hidden until their reveal condition, then cost Diamonds once.
DV.JOBS = {
  blacksmith:{name:'Blacksmith',perk:'Upgrades cost 20% less gold, +5% success above +5.',mods:{upCost:.8,upRate:.05}},
  alchemist:{name:'Alchemist',perk:'Potions heal 50% more. One extra potion per battle.',mods:{potion:1.5,potUses:1}},
  hunter:{name:'Hunter',perk:'+20% gold, +10% gear drop chance.',mods:{gold:1.2,drop:.10}},
  scholar:{name:'Scholar',perk:'+20% XP from battles.',mods:{xp:1.2}},
  gemcutter:{name:'Royal Gemcutter',luxury:true,cost:300,reveal:{level:5},hint:'Reach Lv 5',
    perk:'+10% to all stats. Upgrades up to +8 never fail.',mods:{all:1.1,safeTo:8}},
  chef:{name:'Celestial Chef',luxury:true,cost:450,reveal:{world:1},hint:'Purify Prismara',
    perk:'Start battles with +25% ATK/MAG for 3 turns. Regen 4% HP each turn.',mods:{feast:.25,regen:.04}},
  starforger:{name:'Starforger',luxury:true,cost:550,reveal:{world:2},hint:'Purify Ashenreach',
    perk:'Gear drops roll one rarity higher. +15% drop chance.',mods:{rarityUp:1,drop:.15}},
  baron:{name:'Diamond Baron',luxury:true,cost:750,reveal:{gold:5000},hint:'Earn 5,000 lifetime gold',
    perk:'+50% gold and +5 Diamonds every victory.',mods:{gold:1.5,dia:5}}
};
DV.JOB_SWAP_GOLD = 150;

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
DV.MATERIAL = ['Dawnglass','Cinderforged','Tidepearl','Stormwoven','Duskveil','Diamondheart'];
DV.SLOT_NOUN = { helm:'Circlet', armor:'Cuirass', charm:'Facet Charm' };
// Upgrade: each + adds 10% of base stats. Success rate by current level (index = current +).
DV.UPGRADE = { max:15, rate:[1,1,1,1,1,.9,.8,.7,.6,.5,.42,.35,.3,.25,.2], perLevel:.10 };

// ---------- Worlds & story ----------
// Speaker keys map to portrait colours in the UI.
DV.SPEAKERS = { narr:'', lumeria:'Lumeria', mira:'Mira', vaelith:'Vaelith', brann:'Brann', pyrrhos:'Pyrrhos',
  isla:'Isla', nereon:'Nereon', riku:'Riku', zephyra:'Zephyra', nyxos:'Nyxos', kael:"Kael'thar", hero:'' };

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

DV.WORLDS = [
  { id:1, name:'Prismara', sub:'World of Crystal Dawn', hue:'#8fe3b0',
    god:'Vaelith, the Rotbloom Sovereign', godPure:'Vaelith, God of Harvest',
    blessing:{name:"Harvest's Return",text:'+8% max HP',mods:{hp:.08}},
    foes:['Thornwolf','Blight Sprite','Rotroot Brute','Hollow Shepherd'],
    intro:[
      ['narr','You land in a field where the wheat grows as glass and chimes in the wind. Half of it has turned black.'],
      ['mira','You fell out of the sky. Either that is a miracle or it is the worst omen we have had all season.'],
      ['mira','Lord Vaelith used to bless these fields. Now the roots crawl at night and the herds go missing.'],
      ['lumeria','The Rot has taken him deep. Follow the black roots to the Sunken Granary.']],
    boss:[
      ['vaelith','Another mouth come to feed on MY harvest? Everything grows for me now. You will too.'],
      ['lumeria','He is still in there, Facetborn. Break the Rot, not his spirit.']],
    after:[
      ['narr','The black bloom shatters. A tired old god kneels in clean wheat.'],
      ['vaelith','I fed them poison and called it bounty. Forgive me, little sister.'],
      ['vaelith','Take my blessing. And beware the Forge-Father. Pyrrhos went to the Rot willingly.'],
      ['mira','Someone has to replant. Come back when the gods are sane again.']] },
  { id:2, name:'Ashenreach', sub:'World of the Endless Forge', hue:'#ff8a5b',
    god:'Pyrrhos, the Cinder Tyrant', godPure:'Pyrrhos, God of the Forge',
    blessing:{name:'Forgefire',text:'+8% ATK and MAG',mods:{atk:.08,mag:.08}},
    foes:['Ember Imp','Slag Brute','Ash Wraith','Magma Wyrmling'],
    intro:[
      ['narr','The portal spits you onto basalt. The sky is a ceiling of smoke, lit from below by rivers of molten iron.'],
      ['brann','Fresh meat for the furnaces? No. You carry light. Real light. I have not seen that in nine years.'],
      ['brann','Pyrrhos forges weapons for every corrupted god. Each blade is quenched in a stolen soul.'],
      ['lumeria','He was the proudest of us. The Rot promised him a fire that would never go out.']],
    boss:[
      ['pyrrhos',"Lumeria's little shard. I will hammer you flat and set you in a crown."]],
    after:[
      ['pyrrhos','The fire was cold the whole time. How did I not feel it?'],
      ['pyrrhos','The Rot did not start with us. Someone cracked the Heart from within. Ask the Drowned King what he saw.'],
      ['brann','Go. I will keep the forge lit for the right reasons this time.']] },
  { id:3, name:'Thalassine Deep', sub:'World of Drowned Crowns', hue:'#4fc3f7',
    god:'Nereon, the Drowned King', godPure:'Nereon, Lord of Tides',
    blessing:{name:'Tidal Grace',text:'Heal 3% max HP every turn',mods:{regen:.03}},
    foes:['Abyssal Eel','Coral Husk','Siren of Silt','Leviathan Spawn'],
    intro:[
      ['narr',"You breathe water as easily as air. Lumeria's shard wraps you in a bubble of light."],
      ['isla','A surface-born, down here? The King drowns everything that shines.'],
      ['isla','He sang the tides in, once. Then he swallowed the moon\'s reflection and stopped singing.']],
    boss:[
      ['nereon','I SAW it, little light. I saw the hand that broke the Heart. Better to drown than remember.']],
    after:[
      ['nereon',"Kael'thar. Our eldest. He broke the Heart to hold all of its light himself."],
      ['lumeria','My brother sealed himself away an age ago. He cannot be—'],
      ['nereon','Sealed? Or hiding? The storms of Skyreach answer to him now.']] },
  { id:4, name:'Skyreach Spires', sub:'World of the Broken Sky', hue:'#c3a6ff',
    god:'Zephyra, the Tempest Queen', godPure:'Zephyra, Goddess of Storms',
    blessing:{name:'Wind Step',text:'+10% SPD and +5 CRIT',mods:{spd:.10,critFlat:5}},
    foes:['Gale Harpy','Thunder Roc','Storm Golem','Sky Reaver'],
    intro:[
      ['narr','Islands of stone hang over an endless drop, chained together by lightning.'],
      ['riku','Hop aboard or fall forever, stranger. Those are the options up here.'],
      ['riku','The Queen tore up every sky route. Nobody leaves Skyreach until the Eldest returns.']],
    boss:[
      ['zephyra','Lumeria sent a mortal to do her bleeding for her? How very like her.'],
      ['zephyra',"Kael'thar promised one god, one light, and no more wars between the facets."]],
    after:[
      ['zephyra','One light, and no one left to see it. I was a fool.'],
      ['zephyra','He waits beyond Umbravale, where dreams are made. Nyxos guards his door.'],
      ['riku','Need a ride to the edge of the sky? First trip is free. Second one costs a story.']] },
  { id:5, name:'Umbravale', sub:'World of Waking Nightmares', hue:'#9b8cff',
    god:'Nyxos, the Nightmare Weaver', godPure:'Nyxos, God of Dreams',
    blessing:{name:'Lucid Mind',text:'+15% max MP, skills cost 10% less',mods:{mp:.15,mpCost:.9}},
    foes:['Dread Moth','Mirror Shade','Sleepless Knight','Hollow Self'],
    intro:[
      ['narr','You step through the portal onto your own street. Rain. Headlights. Breaking glass.'],
      ['narr','It is a memory. Umbravale wears it like a mask.'],
      ['lumeria','Trust nothing you see here. Nyxos builds worlds out of wounds.']],
    boss:[
      ['nyxos','Did she tell you why you died? Did she tell you who turned the wheel?'],
      ['nyxos',"Kael'thar needed a soul the Rot cannot touch. So did Lumeria. You were the prize they fought over."]],
    after:[
      ['nyxos','The dream breaks. Good. I am tired of telling lies to children.'],
      ['lumeria','I chose you. I never harmed you. I caught you as you fell. That is all, and it is the truth.'],
      ['lumeria','The Fractured Crown lies open. My brother is waiting.']] },
  { id:6, name:'The Fractured Crown', sub:'Heart of the Diamondverse', hue:'#e8f4ff',
    god:"Kael'thar, the Obsidian Sovereign", godPure:"Kael'thar, the Eldest Facet",
    blessing:{name:'Diamond Heart',text:'+10% to every stat',mods:{all:.10}},
    foes:['Obsidian Sentinel','Rot Seraph','Fragment Golem','Fallen Facet'],
    intro:[
      ['narr','Shards of the Diamond Heart, each as large as a world, orbit a throne of black glass.'],
      ['kael','Sister. You sent your champion to do what you could not. You always were the clever one.'],
      ['kael','Come, Facetborn. Let me show you what a god does with a whole Heart.']],
    boss:[
      ['kael','Every god you purified will fall again. The Rot is no sickness. It is the Verse hungering for one ruler.'],
      ['lumeria','Then let it starve. Facetborn, now!']],
    after:[
      ['narr','The obsidian cracks. Light pours through, and for one breath every world in the Verse can see the sky.'],
      ['kael','You are not of the Verse. That is why the Heart chose you over me.'],
      ['lumeria','The Heart is whole, but its light is thin. Beyond the Fracture, other Hearts are breaking.'],
      ['narr','Season One complete. New worlds wait beyond the Fracture.']] }
];
DV.STAGES_PER_WORLD = 5; // 4 battles + god's avatar
DV.STAGE_NAMES = ['Outskirts','Corrupted Trail','Rot Nest','Inner Sanctum','Avatar of the God'];

// Hero appearance options
DV.LOOK = {
  skin:['#f6d7c3','#e8b896','#c68a62','#9a6243','#6b4330','#d9c4f0'],
  hair:['#1d1a24','#5b3a29','#c98b4a','#f2e1a6','#e6e8f0','#d24d6b','#4b7bff','#3fd6c6'],
  eyes:['#3fd6c6','#ffc145','#b07cff','#ff5d73','#7ad36b','#e8f4ff'],
  outfit:['#2b3a67','#5a2a4f','#1f4d45','#6b2f2a','#3b3b46','#e8e2d6'],
  hairStyle:['Short','Long','Spiked','Tied'],
  origin:[
    {id:'student',name:'Night-class Student',bonus:{int:3},text:'+3 Intellect'},
    {id:'medic',name:'Paramedic',bonus:{spi:2,vit:1},text:'+2 Spirit, +1 Vitality'},
    {id:'courier',name:'Bike Courier',bonus:{agi:3},text:'+3 Agility'},
    {id:'athlete',name:'Gym Rat',bonus:{str:2,vit:1},text:'+2 Strength, +1 Vitality'}
  ]
};
