// Arc III — The Hungry Dark (realms 21–30)
realm({ name:'Lanternhold', sub:'Realm of the Unending Night', biome:'night', hue:'#ffc145',
  people:['Lumen', 'Moth-winged lamplighters who have never seen a sunrise.'], custom:'Wick-day: each Lumen lights one lantern a year for someone they lost.',
  god:{ name:'Ithra', pure:'Ithra, Keeper of Lanterns', corrupted:false }, boss:'The Wick-Eater', guide:'Lamplighter Pell',
  foes:['Shade Moth','Gutter Wraith','Lampless Knight','Dark Swallower'], marks:['Hall of Wicks','Oil Bazaar','Snuffed District','Ithra\'s Beacon'],
  intro:[['Lamplighter Pell','Every lantern you see is a memory. The Wick-Eater is snuffing them, one by one.']],
  bossTalk:[['Wick-Eater','Grief is the sweetest fuel. Light me another.']],
  after:[['Ithra','The Hall of Wicks burns bright. Some of those lanterns are new. People are lighting them for you.']],
  quest:{ title:'Relight the District', giver:'Lamplighter Pell', text:'The Snuffed District is dark. Clear 12 shadows so we can relight it.', goal:['foes',12], reward:{gold:1700,dia:35,shards:24}, done:'Every window, glowing.' },
  bless:['mag',.03,'Lantern Grace'] });

realm({ name:'Rotroot Hollow', sub:'Realm of the Sick Forest', biome:'forest', hue:'#7bb36b',
  people:['Dryads', 'Tree-spirits bound to a single tree each.'], custom:'Grafting: two dryads who love each other graft a branch between their trees.',
  god:{ name:'Sylvaine', pure:'Sylvaine, the Green Heart', corrupted:true }, boss:'Sylvaine, the Rotting Crown', guide:'Dryad Wen',
  foes:['Rot Treant','Fungal Lurker','Blight Stag','Hollow Dryad'], marks:['Grafted Glade','The Sick Spring','Charcoal Ring','Green Heart'],
  intro:[['Dryad Wen','My tree is dying, which means I am dying. Please hurry, but not so fast you miss things.']],
  bossTalk:[['Sylvaine','Rot is only another kind of growing. Let me show you.']],
  after:[['Sylvaine','Green again. Every tree will remember this, and trees remember for a very long time.']],
  quest:{ title:'The Sick Spring', giver:'Dryad Wen', text:'The spring that feeds our roots runs black. Find its source.', goal:['mark',1], reward:{gold:1780,dia:35,shards:26}, done:'Clear water. I can feel my leaves again.' },
  lore:{ mark:2, title:'Charcoal Ring', text:'A circle where a fire once saved the forest from blight. You learn to burn sickness out of flesh.', skill:'h9' },
  bless:['hp',.04,'Green Heart'] });

realm({ name:'Brassmoor', sub:'Realm of Steam and Greed', biome:'clockwork', hue:'#c98b4a',
  people:['Tinkerfolk', 'Tiny gnomes who measure worth in patents.'], custom:'Patent-feasts: a new invention is celebrated by everyone eating off it.',
  god:{ name:'Ferrum', pure:'Ferrum, God of Making', corrupted:true }, boss:'Ferrum, the Golden Engine', guide:'Inventor Pip Wrenly',
  foes:['Steam Golem','Coin Swarm','Debt Collector Automaton','Furnace Hulk'], marks:['Patent Office','Boiler Row','The Mint','Ferrum\'s Engine'],
  intro:[['Pip Wrenly','Ferrum used to say making is a gift. Now he says it is a debt, and everyone owes.']],
  bossTalk:[['Ferrum','Everything has a price. Yours is everything.']],
  after:[['Ferrum','I priced the world and forgot to value it. Pip, your patent for the pocket-gate is approved.'],['Talo Venn','Pocket-gate?!']],
  quest:{ title:'Back Pay', giver:'Pip Wrenly', text:'The Mint is hoarding wages. Crack 4 vault chests and give the workers their due.', goal:['chests'], reward:{gold:1900,dia:35,shards:26}, done:'Payday! First in nine years.' },
  bless:['def',.03,'Maker\'s Gift'] });

realm({ name:'Petalfall Isles', sub:'Realm of Eternal Spring', biome:'blossom', hue:'#ff9ec7',
  people:['Vulpari', 'Fox-folk with many tails who brew tea as a form of prayer.'], custom:'Tea-vows: a promise sworn over tea cannot be broken without losing a tail.',
  god:{ name:'Hanami', pure:'Hanami, the First Blossom', corrupted:false }, boss:'The Wilting Herald', guide:'Tea-Master Saiko',
  foes:['Petal Specter','Thorn Fox','Ink Oni','Wither Moth'], marks:['Teahouse Bridge','Lantern Shrine','Nine-Tail Grove','Hanami\'s Tree'],
  intro:[['Tea-Master Saiko','Sit, please. Even in war, tea is poured properly.'],['Tea-Master Saiko','A Herald is wilting our blossoms. When the last one falls, spring ends forever.']],
  bossTalk:[['Wilting Herald','Every flower dies. I am only honest about it.']],
  after:[['Hanami','Spring returns. Tea-Master, pour for the Facetborn. The good leaves.']],
  quest:{ title:'The Ninth Tail', giver:'Tea-Master Saiko', text:'My student Nimra broke a tea-vow to fight the Herald and fled in shame. Search the Nine-Tail Grove.', goal:['mark',2], reward:{gold:2000,dia:40,shards:28}, done:'A broken vow to save others is kept in spirit. Tell her she can come home.' },
  lore:{ mark:1, title:'The Lantern Shrine Sutra', text:'A short prayer for the hurried: "Breathe, and the world waits for you." You learn to act twice in one moment.', skill:'h10' },
  bless:['spd',.03,'First Blossom'], hidden:'nimra' });

realm({ name:'Duneheart Sanctum', sub:'Realm of Sleeping Pyramids', biome:'desert', hue:'#e8b04a',
  people:['Anubari', 'Jackal-headed priests who weigh hearts against feathers.'], custom:'Heart-weighing: every Anubari\'s heart is weighed at sunset, and the light ones sing.',
  god:{ name:'Sethra', pure:'Sethra, Lord of Sandstorms', corrupted:true }, boss:'Sethra, the Devouring Storm', guide:'Priestess Neferu',
  foes:['Sand Djinn','Mummified Guard','Scarab Swarm','Sphinx Revenant'], marks:['Hall of Scales','Buried Obelisk','Sand-Sea','The Sleeping Pyramid'],
  intro:[['Priestess Neferu','Every heart we weigh now is heavy. Sethra\'s storm fills them with sand.']],
  bossTalk:[['Sethra','Bury it all. Bury every name. Sand forgets nothing because it remembers nothing.']],
  after:[['Sethra','The storm stills. The pyramids may wake now, and tell their stories.']],
  quest:{ title:'Weigh the Scarabs', giver:'Priestess Neferu', text:'Scarab swarms are eating the feathers of judgment. Destroy 12.', goal:['foes',12], reward:{gold:2100,dia:40,shards:28}, done:'Light hearts tonight.' },
  bless:['critFlat',2,'Light Heart'] });

realm({ name:'Coralcrown', sub:'Realm of the Naga Throne', biome:'ocean', hue:'#2fb3a6',
  people:['Naga', 'Serpent-bodied nobles of an ancient sea empire.'], custom:'Shed-crowning: a ruler crowns the heir with their own shed skin.',
  god:{ name:'Thalassa', pure:'Thalassa, Empress of the Deep', corrupted:true }, boss:'Thalassa, the Abyssal Crown', guide:'Prince Ssevrin',
  foes:['Naga Myrmidon','Sea-Hag','Pressure Wraith','Kraken Spawn'], marks:['Coral Court','Shed Vault','The Abyss Lip','Throne of Tides'],
  intro:[['Prince Ssevrin','My mother the Empress has not shed in a century. She is turning to stone, and so is the sea.']],
  bossTalk:[['Thalassa','A crown is forever. Forever is still.']],
  after:[['Thalassa','I shed at last. Ssevrin, the crown is yours. Wear it lightly.']],
  quest:{ title:'The Shed Vault', giver:'Prince Ssevrin', text:'The Shed Vault holds every crown of our line. Something has broken in. Look inside.', goal:['mark',1], reward:{gold:2200,dia:40,shards:30}, done:'The crowns are safe. You have my gratitude, and the Empire\'s.' },
  lore:{ mark:2, title:'The Abyss Lip', text:'Where light ends, a hymn carved by blind priests: "Pressure is only the sea holding you." You learn to turn crushing force into a shield for all.', skill:'h11' },
  bless:['mp',.04,'Abyssal Calm'] });

realm({ name:'Ironveil Citadel', sub:'Realm of the Eternal War', biome:'wasteland', hue:'#b0b8c8',
  people:['Gor\'Khan', 'Orc clans for whom honor is counted in scars freely given.'], custom:'Scar-gift: a warrior thanks a rival by letting them land the first blow.',
  god:{ name:'Vaskar', pure:'Vaskar, the War-Father', corrupted:false }, boss:'Vaskar\'s Champion', guide:'Warlord Vask',
  foes:['Iron Berserker','Siege Hound','War Totem','Rot-Turned Veteran'], marks:['The Proving Ring','Scar Wall','Gate of Truce','Vaskar\'s Altar'],
  intro:[['Warlord Vask','The Rot cannot take Vaskar. War is honest and the Rot hates honesty.'],['Warlord Vask','But Vaskar will not give his blessing to a stranger. You must face his Champion. Honorably.']],
  bossTalk:[['Vaskar\'s Champion','No Rot. No tricks. Show me what you are made of.']],
  after:[['Vaskar','Good blood. Good scars. Vask, you have been aching to travel. Go.'],['Warlord Vask','Ha! I was going anyway.']],
  quest:{ title:'Scar Wall', giver:'Warlord Vask', text:'Rot-Turned Veterans shame the clans. Give 12 of them an honest end.', goal:['foes',12], reward:{gold:2300,dia:40,shards:30}, done:'Their names go back on the Scar Wall. With honor.' },
  bless:['atk',.03,'War-Father\'s Nod'], recruit:'vask' });

realm({ name:'Mirrormere', sub:'Realm of the Twin Lake', biome:'crystal', hue:'#cfe3ff',
  people:['Mirrorkin', 'People who exist in pairs, one in the world and one in the lake.'], custom:'Twin-bonding: each Mirrorkin must say good morning to their reflection, or it goes missing.',
  god:{ name:'Vel', pure:'Vel, the Twin-Faced', corrupted:true }, boss:'Vel, the Broken Reflection', guide:'Ilsa (and Asli)',
  foes:['Reflection Thief','Mirror Golem','Inverted Knight','Glass Serpent'], marks:['Morning Shore','Upside-Down Spire','The Still Point','Vel\'s Double Throne'],
  intro:[['Ilsa (and Asli)','Half of Vel went into the Rot. The other half is trapped under the lake. So are our twins.']],
  bossTalk:[['Vel','Why be two when you could be one? One mind. One hunger.']],
  after:[['Vel','Two faces again. One to remember, one to forgive.']],
  quest:{ title:'Good Morning', giver:'Ilsa (and Asli)', text:'Reflections are going missing. Visit the Still Point where they are kept.', goal:['mark',2], reward:{gold:2400,dia:40,shards:32}, done:'Everyone said good morning today. Everyone.' },
  bless:['mag',.03,'Twin Sight'] });

realm({ name:'Emberwild', sub:'Realm of the Phoenix Prairie', biome:'volcanic', hue:'#ff9a3d',
  people:['Cindrel', 'Phoenix-folk who burn and are reborn once a lifetime.'], custom:'Ash-gifts: the reborn give their old ashes to someone they love.',
  god:{ name:'Phenra', pure:'Phenra, the Endless Return', corrupted:false }, boss:'The Ash-Without-Fire', guide:'Ember',
  foes:['Ash Wolf','Burnt Wraith','Cinder Golem','Cold Flame'], marks:['Rebirth Pyre','Ash Fields','The Cold Hearth','Phenra\'s Nest'],
  intro:[['Ember','The Ash-Without-Fire steals our rebirth. People burn and do not come back.']],
  bossTalk:[['Ash-Without-Fire','Why rise? Ash is so quiet.']],
  after:[['Phenra','The pyres catch again. Ember, you have been reborn once already. Go burn bright somewhere new.'],['Ember','Try to keep up, Facetborn.']],
  quest:{ title:'The Cold Hearth', giver:'Ember', text:'A hearth that freezes fire. Find it and learn what is wrong.', goal:['mark',2], reward:{gold:2500,dia:45,shards:32}, done:'Nihilus\' mark. It is reaching further.' },
  bless:['regen',.005,'Endless Return'], recruit:'ember' });

realm({ name:"Nihil's Threshold", sub:'Edge of the Hollow', biome:'void', hue:'#8a5cff',
  people:['the Hollow Choir', 'Former mortals emptied by Nihilus, singing his silence.'], custom:'There are none. The Choir took them.',
  god:{ name:'Vorthane', pure:'Vorthane, Voice Restored', corrupted:true }, boss:'Vorthane, Voice of Nihilus', guide:'lumeria',
  foes:['Hollow Chorister','Silence Wraith','Echo Devourer','Unmade Saint'], marks:['Last Lantern','Choir Stairs','The Mute Bell','Throat of the Hollow'],
  intro:[['lumeria','Here the Lattice thins. Beneath, I can feel him. Nihilus.'],['lumeria','Facetborn, I am weakening. Every god you heal draws on my light. I would not trade it.']],
  bossTalk:[['Vorthane','He is so quiet. So peaceful. Join the Choir. Never be afraid again.']],
  after:[['Vorthane','I remember my own voice. Thank you.'],['lumeria','Beyond this threshold lie realms no gate has reached. The Quorin will need to build new ones.'],['Talo Venn','I have been waiting my whole life for that sentence.']],
  quest:{ title:'The Mute Bell', giver:'lumeria', text:'Ring the Mute Bell and break the silence.', goal:['mark',2], reward:{gold:2700,dia:50,shards:34}, done:'It rang. Everyone in the Choir turned to listen.' },
  bless:['all',.03,'Voice Restored'] });
