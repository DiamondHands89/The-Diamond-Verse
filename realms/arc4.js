// Arc IV — Realms Unbound (realms 31–40)
realm({ name:'Skyglass Sea', sub:'Realm of Floating Oceans', biome:'sky', hue:'#9fe7ff',
  people:['Nimbari', 'Riders of cloud-whales who never set foot on land.'], custom:'Whale-songs: each family sings a whale-song so the herd knows them.',
  god:{ name:'Aeris', pure:'Aeris, the Upper Tide', corrupted:true }, boss:'Aeris, the Falling Sky', guide:'Rider Oona',
  foes:['Cloud Shark','Sky Kraken Spawn','Storm Wisp','Whale-Lice Swarm'], marks:['Whale Harbor','Glass Shallows','Rain Spire','Aeris\' Current'],
  intro:[['Talo Venn','First gate past the Threshold. Built it myself. Pip helped. Mostly with snacks.'],['Rider Oona','The sea is falling. Literally. Water pours off the edges and Aeris does not stop it.']],
  bossTalk:[['Aeris','Let it all fall. Let it rain on whatever is below.']],
  after:[['Aeris','The sea holds its shape. I had forgotten the sky needs to want to be a sky.']],
  quest:{ title:'Calves Overboard', giver:'Rider Oona', text:'Whale-lice swarms are bleeding the calves. Clear 14.', goal:['foes',14], reward:{gold:2800,dia:45,shards:34}, done:'Listen. The whole herd is singing.' },
  bless:['spd',.03,'Upper Tide'] });

realm({ name:'Thornveil Barony', sub:'Realm of the Velvet Night', biome:'nightmare', hue:'#d24d6b',
  people:['the Sanguine Court', 'Pale aristocrats who drink red wine of roses, not blood. Mostly.'], custom:'Masquerades: no one shows their true face until a vow is made.',
  god:{ name:'Morvaine', pure:'Morvaine, Lady of Masks', corrupted:true }, boss:'Morvaine, the Faceless', guide:'Countess Lirelle',
  foes:['Thorn Bat','Masked Duelist','Crimson Hound','Faceless Noble'], marks:['Rose Gate','Ballroom of Masks','Crypt Gardens','Morvaine\'s Manor'],
  intro:[['Countess Lirelle','Darling, how charming. A guest with a face. We have not seen one of those in years.'],['Countess Lirelle','Lady Morvaine took every face for her collection, including her own.']],
  bossTalk:[['Morvaine','Faces lie. Without them, we are all the same hunger.']],
  after:[['Morvaine','My face. Oh. I had forgotten I looked so tired.']],
  quest:{ title:'The Masquerade', giver:'Countess Lirelle', text:'Return 4 stolen masks hidden in the manor grounds.', goal:['chests'], reward:{gold:2900,dia:45,shards:36}, done:'Tonight, we unmask. Together.' },
  bless:['critFlat',2,'Velvet Edge'] });

realm({ name:'Starfall Crater', sub:'Realm of the Fallen Star', biome:'crater', hue:'#ffe08a',
  people:['Stoneborn', 'Golems born from meteor-stone who hum with starlight.'], custom:'Sky-watching: the Stoneborn take turns staying awake to watch for falling kin.',
  god:{ name:'Astrael', pure:'Astrael, the Falling Star', corrupted:false }, boss:'The Crater Wyrm', guide:'Watcher Gneiss',
  foes:['Meteor Beetle','Crater Wyrmling','Stardust Wraith','Glass Golem'], marks:['Watcher\'s Rest','Impact Ring','The Crater\'s Eye','Astrael\'s Fall'],
  intro:[['Watcher Gneiss','A hooded wanderer arrived years ago. He mends what the Rot breaks and will not give his name.']],
  bossTalk:[['Crater Wyrm','A star fell here. I ate it. I am still hungry.']],
  after:[['Astrael','You walked with my light. Take some with you.']],
  quest:{ title:'The Hooded Wanderer', giver:'Watcher Gneiss', text:'The wanderer camps at the Crater\'s Eye. He asked to meet the Facetborn, if they ever came.', goal:['mark',2], reward:{gold:3000,dia:50,shards:36}, done:'He went with you? Good. He looked lonely.' },
  lore:{ mark:3, title:'Fall of Astrael', text:'A god chose to fall so a world could have light. You learn to call that falling down on your enemies.', skill:'h12' },
  bless:['mag',.03,'Star-Touched'], hidden:'kael' });

realm({ name:'Myriad Bazaar', sub:'Realm of All Roads', biome:'bazaar', hue:'#ff7a59',
  people:['Everyone', 'Traders from a hundred realms who came through old gates and never left.'], custom:'Haggling is sacred. Paying full price is an insult.',
  god:{ name:'Mercato', pure:'Mercato, God of Exchange', corrupted:false }, boss:'The Debt Collector', guide:'Auctioneer Zib',
  foes:['Pickpocket Imp','Ledger Wraith','Collector Golem','Contract Devil'], marks:['Grand Auction','Gate Row','Lost & Found','Mercato\'s Scales'],
  intro:[['Auctioneer Zib','Welcome, welcome! Everything is for sale except Mercato, and the Debt Collector is trying to buy even him.']],
  bossTalk:[['Debt Collector','Every realm owes Nihilus its light. I am here to collect.']],
  after:[['Mercato','A fair exchange: a realm saved for a blessing given. The Bazaar will remember your discount.']],
  quest:{ title:'Lost & Found', giver:'Auctioneer Zib', text:'A crate of travelers\' heirlooms was stolen. Find the 4 hidden stashes.', goal:['chests'], reward:{gold:3200,dia:50,shards:38}, done:'Everyone gets their thing back. Unheard of! Wonderful!' },
  bless:['def',.03,'Fair Exchange'] });

realm({ name:'Wyrmrest Highlands', sub:'Realm of the Elder Dragons', biome:'tundra', hue:'#6fe3a1',
  people:['Dragonkin', 'Proud winged folk descended from dragons that took mortal shape.'], custom:'Hoard-giving: a Dragonkin\'s wealth is measured by what they give away.',
  god:{ name:'Draknor', pure:'Draknor, Eldest Wing', corrupted:true }, boss:'Draknor, the Rot-Wyrm', guide:'Wingmaiden Seryth',
  foes:['Drake Sentinel','Wyvern Raider','Rot Drake','Ancient Bone Dragon'], marks:['Roost Cliffs','Hoard Hall','Wind Shelf','Draknor\'s Peak'],
  intro:[['Wingmaiden Seryth','The Eldest hoards now. Gold, light, children. Everything.']],
  bossTalk:[['Draknor','MINE. All of it. Forever.']],
  after:[['Draknor','What is a hoard with no one to give it to? Take this. Take all of it.']],
  quest:{ title:'Wyvern Season', giver:'Wingmaiden Seryth', text:'Raiders harry the roosts. Clear 14.', goal:['foes',14], reward:{gold:3300,dia:50,shards:38}, done:'The young can fly again.' },
  bless:['atk',.03,'Wing of the Eldest'] });

realm({ name:'Veilwood', sub:'Realm of the Fae Courts', biome:'forest', hue:'#c3a6ff',
  people:['Fae', 'Bargain-bound fairies who cannot lie but love a technicality.'], custom:'Name-keeping: true names are only told to the trusted.',
  god:{ name:'Maelis', pure:'Maelis, Queen of Twilight', corrupted:true }, boss:'Maelis, the Thorned Bargain', guide:'Puck-of-Nine-Doors',
  foes:['Thorn Sprite','Changeling','Bargain Hound','Wild Hunt Rider'], marks:['Mushroom Ring','Court of Doors','The Endless Glade','Twilight Throne'],
  intro:[['Puck-of-Nine-Doors','A visitor! Do not eat anything. Do not say thank you. Do not tell me your name. Now, welcome!']],
  bossTalk:[['Maelis','I bargained with the Hollow. My court for my life. A fair trade, I thought.']],
  after:[['Maelis','The bargain is broken. I owe you, Facetborn, and fae always pay.']],
  quest:{ title:'Nine Doors', giver:'Puck-of-Nine-Doors', text:'Find the Court of Doors and pick the right one. Or the wrong one. Both are interesting.', goal:['mark',1], reward:{gold:3400,dia:50,shards:40}, done:'You picked the door that led back. Clever!' },
  lore:{ mark:2, title:'The Endless Glade', text:'Time loops here. You learn a step that is always one beat ahead.', skill:'h13' },
  bless:['spd',.03,'Twilight Step'] });

realm({ name:'Chronoflux', sub:'Realm of Broken Time', biome:'crystal', hue:'#a6c8ff',
  people:['Chronari', 'People who age backward and forward depending on the hour.'], custom:'Birthday-on-demand: you celebrate whenever you happen to be younger.',
  god:{ name:'Tempus', pure:'Tempus, Keeper of Hours', corrupted:false }, boss:'The Stopped Clock', guide:'Clockmistress Ava',
  foes:['Paradox Hound','Echo Soldier','Rewind Wraith','Hour-Eater'], marks:['Plaza of Hours','Tock\'s Workshop','The Frozen Second','Tempus\' Dial'],
  intro:[['Clockmistress Ava','You arrived yesterday. Or tomorrow. Either way, welcome. The Stopped Clock is eating time.']],
  bossTalk:[['Stopped Clock','No more after. No more before. Only now, forever.']],
  after:[['Tempus','Time flows again. My old watchmaker went missing in a loop. If you find him, he is welcome to wander.']],
  quest:{ title:'Old Tock', giver:'Clockmistress Ava', text:'The watchmaker Tock is stuck in a loop at his workshop. Break him out.', goal:['mark',1], reward:{gold:3500,dia:55,shards:40}, done:'He made it out? He will need to catch up on several decades of news.' },
  bless:['regen',.005,'Flowing Hours'], hidden:'tock' });

realm({ name:'Abyssal Trench', sub:'Realm Beneath the Deepest Sea', biome:'ocean', hue:'#2b5bd1',
  people:['Anglerfolk', 'Lantern-headed folk who live where sunlight is a myth.'], custom:'Lure-lighting: the brightest lure leads the family.',
  god:{ name:'Leviat', pure:'Leviat, the Patient Deep', corrupted:true }, boss:'Leviat, the Lightless Maw', guide:'Lure-Elder Bulb',
  foes:['Gulper Eel','Pressure Golem','Lightless Angler','Trench Horror'], marks:['Lure Village','Black Smoker Vents','The Unlit Drop','Leviat\'s Maw'],
  intro:[['Lure-Elder Bulb','Light is precious here. Leviat swallows every lure. Soon we will be blind.']],
  bossTalk:[['Leviat','Darkness is the oldest thing. Return to it.']],
  after:[['Leviat','I forgot I was patient, not hungry. Forgive me, little lights.']],
  quest:{ title:'Lures for the Lost', giver:'Lure-Elder Bulb', text:'Recover 4 lure-caches from the vents.', goal:['chests'], reward:{gold:3700,dia:55,shards:42}, done:'Every family has light again.' },
  lore:{ mark:2, title:'The Unlit Drop', text:'At the bottom of everything, a single carving: a hand holding a candle. You learn to share your light with the whole party.', skill:'h14' },
  bless:['hp',.04,'Patient Deep'] });

realm({ name:'Sunspire', sub:'Realm of the Solar Throne', biome:'celestial', hue:'#ffd166',
  people:['Solari', 'Golden-skinned folk who sleep only during eclipses.'], custom:'Dawn-greeting: every Solari salutes the sun before they speak.',
  god:{ name:'Solaris', pure:'Solaris, the Morning Crown', corrupted:true }, boss:'Solaris, the Burning Eye', guide:'Sun-Herald Aten',
  foes:['Glare Wraith','Solar Templar','Sunburnt Husk','Flare Serpent'], marks:['Dawn Steps','Mirror Fields','The Eclipse Altar','Solar Throne'],
  intro:[['Sun-Herald Aten','The sun never sets now. Crops burn. Rivers boil. Solaris will not blink.']],
  bossTalk:[['Solaris','Light is good. MORE light is better. ALL light is perfect.']],
  after:[['Solaris','I will set tonight. I am so tired.'],['lumeria','Rest, brother. You earned it.']],
  quest:{ title:'Eclipse', giver:'Sun-Herald Aten', text:'Clear 14 sun-creatures so we can reach the Eclipse Altar.', goal:['foes',14], reward:{gold:3800,dia:55,shards:42}, done:'Night! Real night! Everyone is asleep in the streets.' },
  bless:['mag',.03,'Morning Crown'] });

realm({ name:'The Unwritten', sub:'Realm of Every Story', biome:'library', hue:'#e8e2d6',
  people:['Inkborn', 'People made of ink and margin-notes who live inside books.'], custom:'Re-reading: a beloved story is re-lived once a year, word for word.',
  god:{ name:'Scriptor', pure:'Scriptor, Author of Realms', corrupted:false }, boss:"Lumeria's Shadow", guide:'Librarian Folio',
  foes:['Ink Wraith','Paper Golem','Plot Hole','Redacted Knight'], marks:['Reading Room','Stacks of Lost Realms','The Blank Page','Scriptor\'s Desk'],
  intro:[['Librarian Folio','Every realm is a book here. Some are being erased. Including yours, Facetborn.'],['Scriptor','Nihilus is writing a story with one character: himself. He made a shadow of Lumeria to end yours.']],
  bossTalk:[["Lumeria's Shadow",'I am every doubt she ever had. Did she choose you? Or did she just use you?'],['lumeria','I chose. And I would choose again.']],
  after:[['Scriptor','The story continues. Only ten realms remain between you and the Hollow Heart.'],['lumeria','Ten realms. And I am almost out of light. We go together, to the end.']],
  quest:{ title:'The Blank Page', giver:'Librarian Folio', text:'Find the Blank Page. It is where erased realms go.', goal:['mark',2], reward:{gold:4000,dia:60,shards:44}, done:'You read the erased realms aloud. Some of them came back.' },
  lore:{ mark:1, title:'Stacks of Lost Realms', text:'A forgotten epic tells of a hero who ended a battle with one sentence. You learn that sentence.', skill:'h15' },
  bless:['all',.03,'Author\'s Margin'] });
