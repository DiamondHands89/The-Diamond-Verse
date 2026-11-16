// Arc II — The Lattice Wars (realms 11–20)
realm({ name:'Gearwright Bastion', sub:'Realm of the Wound Clock', biome:'clockwork', hue:'#d9a441',
  people:['Cogborn', 'Brass automatons who believe they were dreamed into being by their god.'], custom:'Winding Day: once a year, every Cogborn winds another\'s heart-spring by hand.',
  god:{ name:'Oriel', pure:'Oriel, the Patient Machine', corrupted:false }, boss:'The Rust Leviathan', guide:'Foreman Ticktavius',
  foes:['Rust Mite','Scrap Knight','Corroded Hulk','Oil Wraith'], marks:['Mainspring Plaza','Scrapyard Maze','The Great Escapement','Oriel\'s Workshop'],
  intro:[['Foreman Ticktavius','Organic visitor detected. Greetings. Please do not oxidize anything.'],['Foreman Ticktavius','The Rot arrived as rust. Lord Oriel is untouched, but the Leviathan eats his city one gear at a time.']],
  bossTalk:[['Rust Leviathan','EVERYTHING ENDS IN RUST. I AM ONLY EARLY.']],
  after:[['Oriel','You moved faster than rust. I will remember the shape of that.'],['Talo Venn','Their gate-math is better than ours. Do not tell my department.']],
  quest:{ title:'Lost Spring', giver:'Foreman Ticktavius', text:'A small unit went missing in the Scrapyard Maze before Winding Day. Please locate it.', goal:['mark',1], reward:{gold:840,dia:25,shards:14}, done:'Unit Seven is functional. Unit Seven is... insisting on following you.' },
  bless:['def',.03,'Patient Plating'], hidden:'seven' });

realm({ name:'Mirelight Fens', sub:'Realm of Lantern Bogs', biome:'swamp', hue:'#9fd36b',
  people:['Bogwyn', 'Frog-folk who read fortunes in the patterns of swamp gas.'], custom:'Lantern-courting: you propose by catching someone a will-o-wisp.',
  god:{ name:'Morrowmaw', pure:'Morrowmaw, Keeper of Still Waters', corrupted:true }, boss:'Morrowmaw, the Drowning Gut', guide:'Auntie Gloop',
  foes:['Bog Lurker','Wisp Thief','Leech Matron','Swamp Colossus'], marks:['Lantern Market','Gas Oracle','Sunken Shrine','The Gut'],
  intro:[['Auntie Gloop','The gas told me a bright stranger was coming. It also told me I would lose a shoe. Both true.'],['Auntie Gloop','Morrowmaw swallowed the dry land. Now the bog swallows us.']],
  bossTalk:[['Morrowmaw','Sink. Sink. Everything sinks eventually. I am only helping.']],
  after:[['Morrowmaw','The water is still again. Still, not hungry. There is a difference.']],
  quest:{ title:'Wisps for Courting', giver:'Auntie Gloop', text:'Wisp Thieves stole every lantern for courting season. Clear 10 bog-beasts so the wisps come back.', goal:['foes',10], reward:{gold:900,dia:25,shards:14}, done:'Three proposals already! Fertile season.' },
  lore:{ mark:1, title:'What the Gas Said', text:'"Rot is a mouth with no stomach. It can only take." You learn to give instead, and the giving heals.', skill:'h6' },
  bless:['regen',.005,'Still Water'] });

realm({ name:'Cindral Archipelago', sub:'Realm of Burning Isles', biome:'volcanic', hue:'#ff6a3d',
  people:['Drakkin', 'Scaled sailors who sail lava seas in obsidian hulls.'], custom:'Burning-the-boat: a captain\'s first ship is always burned, so they never fear losing one.',
  god:{ name:'Ignara', pure:'Ignara, Mother of Islands', corrupted:true }, boss:'Ignara, the Caldera Queen', guide:'Captain Rasha',
  foes:['Lava Skimmer','Cinder Drake','Basalt Brute','Smoke Siren'], marks:['Obsidian Harbor','Burning-Boat Beach','The Steam Vents','Caldera Crown'],
  intro:[['Captain Rasha','Islands are sinking. Ignara is pulling them back into the fire she made them from.']],
  bossTalk:[['Ignara','I birthed these islands. I may unmake them.']],
  after:[['Ignara','A mother holds, she does not swallow. I had forgotten the difference.']],
  quest:{ title:'Ashore', giver:'Captain Rasha', text:'Drag 4 salvage chests up the beach before the tide of magma takes them.', goal:['chests'], reward:{gold:980,dia:25,shards:16}, done:'Good haul. You could sail with us any day.' },
  bless:['atk',.03,'Island Fire'] });

realm({ name:'Glimmerdeep Caverns', sub:'Realm of Underground Stars', biome:'crystal', hue:'#b07cff',
  people:['Gloamkin', 'Blind mole-folk who see by the singing of crystals.'], custom:'Echo-names: you are named by the echo your first cry makes.',
  god:{ name:'Lithos', pure:'Lithos, the Deep Patience', corrupted:false }, boss:'The Hollow Choir-Mother', guide:'Delver Skree',
  foes:['Crystal Crawler','Echo Bat','Geode Golem','Choir Shade'], marks:['Echo Hall','Crystal Lake','The Singing Vein','Lithos\' Throne'],
  intro:[['Delver Skree','You walk loud. Good. Quiet things down here are usually hunting.'],['Delver Skree','Lithos sleeps in the rock. The Rot is trying to wake him wrong.']],
  bossTalk:[['Choir-Mother','Sing with us. Sing the hollow song. It is so much easier than being someone.']],
  after:[['Lithos','I slept through the danger and woke to a stranger who saved me. Humbling. Thank you.']],
  quest:{ title:'The Singing Vein', giver:'Delver Skree', text:'The Singing Vein went quiet. Go listen, and tell me what you hear.', goal:['mark',2], reward:{gold:1060,dia:30,shards:16}, done:'A heartbeat? Lithos is dreaming. Good dream or bad?' },
  bless:['mag',.03,'Deep Patience'] });

realm({ name:'Aurora Steppe', sub:'Realm of Endless Grass', biome:'meadow', hue:'#a0f0c0',
  people:['Varrani', 'Centaur herders who follow the aurora across the grasslands.'], custom:'The Long Ride: grief is carried by galloping until the sun rises.',
  god:{ name:'Rhosa', pure:'Rhosa, Lady of Herds', corrupted:true }, boss:'Rhosa, the Stampede', guide:'Khan Tamur',
  foes:['Rot Stallion','Grass Stalker','Thunderhoof','Aurora Wraith'], marks:['Herd Camp','Standing Stones','The Endless Grass','Aurora Gate'],
  intro:[['Khan Tamur','Our goddess runs without stopping and the herds run with her, until their hearts burst.']],
  bossTalk:[['Rhosa','Run! RUN! If we stop, it catches us!']],
  after:[['Rhosa','I was fleeing something under the Lattice. Something hungry. I am sorry I made my children run too.']],
  quest:{ title:'The Long Ride', giver:'Khan Tamur', text:'Thundering beasts scattered our foals. Put down 10 so the herd can gather.', goal:['foes',10], reward:{gold:1140,dia:30,shards:18}, done:'We will ride for the lost tonight, and sing for you after.' },
  bless:['spd',.04,'Herd Rhythm'] });

realm({ name:'Bonewind Wastes', sub:'Realm of Honored Dead', biome:'wasteland', hue:'#e8e2d6',
  people:['Ossuar', 'Skeletal monks who keep their ancestors\' bones as a library.'], custom:'Bone-reading: the dead are consulted by touching their knuckles.',
  god:{ name:'Mortessa', pure:'Mortessa, Keeper of Endings', corrupted:false }, boss:'The Soul-Thief Herald', guide:'Sister Calavera',
  foes:['Bone Vulture','Soul Leech','Grave Colossus','Hollow Pilgrim'], marks:['Library of Knuckles','Wind Ossuary','The Long Road','Mortessa\'s Gate'],
  intro:[['Sister Calavera','Peace, traveler. Do not fear us. We are only what everyone becomes, with better manners.'],['Sister Calavera','Lady Mortessa guards endings. The Rot wants souls that do not end, only empty.']],
  bossTalk:[['Soul-Thief Herald','Endings are wasted on the dead. Give them to me.']],
  after:[['Mortessa','Every ending here is honest again. Calavera, the living need you more than we do.'],['Sister Calavera','Then I will walk with the living, for a while.']],
  quest:{ title:'Knuckle Library', giver:'Sister Calavera', text:'Four reliquaries were scattered by the Herald. Return them to their places.', goal:['chests'], reward:{gold:1220,dia:30,shards:18}, done:'The ancestors have their voices back. They say you are very loud.' },
  lore:{ mark:3, title:'The Last Door', text:'Mortessa\'s gate is inscribed: "Nothing ends that is remembered." You learn to call the fallen back to their feet.', skill:'h7' },
  bless:['hp',.04,'Honest Ending'], recruit:'calavera' });

realm({ name:'Silkspire Canopy', sub:'Realm of the Woven Sky', biome:'jungle', hue:'#e0b3ff',
  people:['Arachnae', 'Six-limbed weavers who live in a city strung between tree-tops.'], custom:'Thread-contracts: agreements are woven, and broken by cutting.',
  god:{ name:'Anansa', pure:'Anansa, the Story-Weaver', corrupted:true }, boss:'Anansa, the Web of Lies', guide:'Weaver Thessaly',
  foes:['Silk Stalker','Cocoon Horror','Web Drifter','Lie-Spinner'], marks:['Thread Market','The Great Loom','Snapped Bridge','Anansa\'s Cocoon'],
  intro:[['Weaver Thessaly','Careful. Every thread here tells a story, and since the Rot, most of them are lies.']],
  bossTalk:[['Anansa','I wove the truth for ten thousand years. Lies are SO much prettier.']],
  after:[['Anansa','I will unweave the lies, one thread at a time. It will take an age. I have one.']],
  quest:{ title:'The Snapped Bridge', giver:'Weaver Thessaly', text:'My sister went to mend the Snapped Bridge and has not returned.', goal:['mark',2], reward:{gold:1300,dia:30,shards:20}, done:'Ysra! You found her. She says she is coming with you, which is very like her.' },
  bless:['critFlat',2,'True Thread'], hidden:'ysra' });

realm({ name:'Tidecall Shoals', sub:'Realm of Singing Reefs', biome:'ocean', hue:'#3ddbd9',
  people:['Selkie', 'Seal-folk who shed their skins to walk the shore at night.'], custom:'Skin-trust: lovers swap seal-skins for a night.',
  god:{ name:'Pelagia', pure:'Pelagia, the Open Sea', corrupted:false }, boss:'The Brine Herald', guide:'Murin',
  foes:['Reef Shark','Brine Hag','Salt Golem','Tide Phantom'], marks:['Skin-Shore','Reef Cathedral','Wreck of the Venn','Pelagia\'s Pool'],
  intro:[['Murin','The Herald steals our skins. Without them we cannot go home to the sea.']],
  bossTalk:[['Brine Herald','A skin for every year I hungered. I am owed so many.']],
  after:[['Pelagia','My children can swim home. Wreck of the Venn, you say? Talo, I think that ship was your grandmother\'s.'],['Talo Venn','She always said she sailed to another realm. Nobody believed her. I did.']],
  quest:{ title:'Skins for the Shore', giver:'Murin', text:'Recover 4 chests of stolen seal-skins.', goal:['chests'], reward:{gold:1380,dia:30,shards:20}, done:'Tonight, everyone swims.' },
  bless:['mp',.05,'Open Sea'] });

realm({ name:'Stormforge Peaks', sub:'Realm of Thunder Anvils', biome:'storm', hue:'#7fb3ff',
  people:['Thunderborn', 'Giants who forge lightning into tools.'], custom:'Strike-marks: a giant\'s age is counted by lightning scars.',
  god:{ name:'Tharos', pure:'Tharos, the Thunder-Smith', corrupted:true }, boss:'Tharos, the Storm Unending', guide:'Forge-Giant Hulda',
  foes:['Spark Elemental','Thunder Ram','Storm Giant Thrall','Lightning Wyrm'], marks:['Strike Plateau','Anvil Peak','Rain Bellows','Tharos\' Forge'],
  intro:[['Forge-Giant Hulda','Brother Tharos is Zephyra\'s twin. When she fell, he followed her into the storm.']],
  bossTalk:[['Tharos','My sister is free? Then the storm is mine alone!'],['lumeria','She is waiting for you, Tharos. Come home.']],
  after:[['Tharos','Zephyra? You are here? Then I have been raging at nothing.'],['Zephyra','Come, brother. We have weather to repair.']],
  quest:{ title:'Storm Census', giver:'Forge-Giant Hulda', text:'Too many storm-beasts. The forges cannot get lightning. Clear 12.', goal:['foes',12], reward:{gold:1460,dia:35,shards:22}, done:'The anvils ring again. That is the best music.' },
  bless:['atk',.03,'Thunder Temper'] });

realm({ name:'The Rift Between', sub:'Wound in the Lattice', biome:'void', hue:'#ff4d7a',
  people:['the Unmoored', 'Travelers lost between realms, half-real and fading.'], custom:'Anchoring: the Unmoored hold hands to remember they exist.',
  god:{ name:"Kael'thar", pure:"Kael'thar, Penitent", corrupted:true }, boss:"Kael'thar, Rift-Bound", guide:'lumeria',
  foes:['Rift Shade','Fading Pilgrim','Void Mantis','Lattice Breaker'], marks:['Anchor Circle','Shattered Gate','Mirror Rift','Kael\'s Prison'],
  intro:[['lumeria','This is where my brother hid. Not a realm. A wound between them.'],['Talo Venn','The resonance is screaming. Every gate we have tuned is groaning from here.']],
  bossTalk:[["Kael'thar",'You think I am the Rot\'s master? I am its door. Something beneath the Lattice opened me.'],["Kael'thar",'It is called Nihilus. The Hollow Facet. The god of a realm that died.']],
  after:[["Kael'thar",'The voice stops. For the first time in an age, the voice stops.'],["Kael'thar",'I cannot undo what I did, sister. But I can walk until I find a way to pay for it.'],
    ['narr','Kael\'thar steps through a gate and is gone. Somewhere, in some far realm, he will be waiting.']],
  quest:{ title:'Hold Their Hands', giver:'lumeria', text:'The Unmoored are fading. Open 4 anchor-caches so they can tether themselves.', goal:['chests'], reward:{gold:1600,dia:40,shards:24}, done:'They are holding on. So are we.' },
  lore:{ mark:3, title:'Kael\'s Confession', text:'Words scraped into the prison wall: "I only wanted no more wars between us. It promised peace. It meant silence." His last technique is etched beneath.', skill:'h8' },
  bless:['all',.03,'Rift Seal'] });
