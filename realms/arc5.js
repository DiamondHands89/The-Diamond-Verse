// Arc V — The Hollow Heart (realms 41–50)
realm({ name:'Ashen Remnant', sub:'Realm That Died', biome:'wasteland', hue:'#9aa3b5',
  people:['the Last Embers', 'Survivors of a realm whose god was eaten whole.'], custom:'Ember-keeping: the last fire is never allowed to go out.',
  god:{ name:'Orun', pure:'Orun, the Remembered', corrupted:false }, boss:'The Grave-Herald', guide:'Keeper Ash',
  foes:['Cinder Ghoul','Hollow Husk','Grave Wyrm','Remnant Wraith'], marks:['The Last Fire','Godless Temple','Ash Sea','Orun\'s Grave'],
  intro:[['Keeper Ash','Our god Orun was the first Nihilus ate. We are what is left of a realm without an anchor.'],['Talo Venn','A realm without a god should collapse. Their memory of Orun is holding it up. Amazing.']],
  bossTalk:[['Grave-Herald','A dead realm. Why does it still stand? I will finish the meal.']],
  after:[['Keeper Ash','Orun is gone, but you proved remembering is enough to stand. We will keep remembering.']],
  quest:{ title:'The Last Fire', giver:'Keeper Ash', text:'Carry the Last Fire\'s embers to 4 old hearths so the realm stays warm.', goal:['chests'], reward:{gold:4200,dia:60,shards:46}, done:'Five fires now. Five!' },
  bless:['hp',.04,'Remembered Warmth'] });

realm({ name:'Frostfire Divide', sub:'Realm Split in Two', biome:'tundra', hue:'#ff9ec7',
  people:['the Divided', 'Twin nations of ice and flame who have not spoken in a thousand years.'], custom:'The Line: no one may cross the boundary stones, ever.',
  god:{ name:'Kaldra', pure:'Kaldra, the Balanced', corrupted:true }, boss:'Kaldra, the Sundered', guide:'Envoy Ysa',
  foes:['Frost Salamander','Fire Yeti','Steam Elemental','Divide Reaver'], marks:['Boundary Stones','Hall of Ice','Hall of Flame','Kaldra\'s Scale'],
  intro:[['Envoy Ysa','Kaldra split herself in two. Now each half wages war on the other, and on us.']],
  bossTalk:[['Kaldra','Fire OR ice. Never both. Choose!']],
  after:[['Kaldra','Both. It was always both. The Line can come down.']],
  quest:{ title:'Cross the Line', giver:'Envoy Ysa', text:'Visit both halls and carry word across. Start with the Hall of Flame.', goal:['mark',2], reward:{gold:4400,dia:60,shards:46}, done:'Our nations will meet. First time in a thousand years.' },
  bless:['atk',.03,'Balanced Edge'] });

realm({ name:'Gloomspore Depths', sub:'Realm of the Fungal Mind', biome:'fungal', hue:'#c08bff',
  people:['Myconids', 'Mushroom-folk who share one dreaming mind.'], custom:'Spore-sharing: memories are passed on by breathing together.',
  god:{ name:'the Sporemother', pure:'the Sporemother, Root of Minds', corrupted:true }, boss:'the Sporemother, Hive of Hunger', guide:'Speaker Puffcap',
  foes:['Spore Drone','Fungal Brute','Mind Leech','Rot Bloom'], marks:['Breathing Hall','Mycelium Bridge','The Glow Garden','Mother\'s Bed'],
  intro:[['Speaker Puffcap','WE. Sorry. We. I. The mind is sick. Many voices are now one hungry voice.']],
  bossTalk:[['Sporemother','ONE MIND. ONE HUNGER. JOIN.']],
  after:[['Sporemother','Many voices again. Noisy. Wonderful.']],
  quest:{ title:'Weeding the Mind', giver:'Speaker Puffcap', text:'Rot Blooms poison the shared mind. Clear 16.', goal:['foes',16], reward:{gold:4600,dia:60,shards:48}, done:'We are thinking clearly. We think you are good.' },
  lore:{ mark:2, title:'Glow Garden Memory', text:'A shared memory of a healer who held the whole hive alive for a night. You learn to mend everyone at once.', skill:'h16' },
  bless:['mp',.04,'Many Minds'] });

realm({ name:'Celestine Gardens', sub:'Realm of the Seraphs', biome:'celestial', hue:'#fff3c4',
  people:['Seraphs', 'Six-winged guardians who tend gardens of living light.'], custom:'Wing-vow: a seraph gives a feather to anyone they swear to protect.',
  god:{ name:'Haloria', pure:'Haloria, Lady of Mercy', corrupted:false }, boss:'The Fallen Choir', guide:'Seraphine',
  foes:['Fallen Seraph','Light-Eater','Halo Wraith','Gilded Golem'], marks:['Garden Gate','Fountain of Mercy','Feather Spire','Haloria\'s Bower'],
  intro:[['Seraphine','Haloria is whole, but half our choir has fallen to the Rot. They were my sisters.']],
  bossTalk:[['Fallen Choir','Mercy is weakness. We are strong now. We are hollow and strong.']],
  after:[['Haloria','My fallen children rest. Seraphine, your feather is promised. Go and keep the promise.'],['Seraphine','I swore to protect the Facetborn. I meant it.']],
  quest:{ title:'Feathers Scattered', giver:'Seraphine', text:'The fallen scattered our vow-feathers. Collect the 4 caches.', goal:['chests'], reward:{gold:4800,dia:65,shards:48}, done:'Every feather, home.' },
  bless:['regen',.005,'Mercy'], recruit:'seraphine' });

realm({ name:'Bloodmoon Steppes', sub:'Realm of the Red Hunt', biome:'nightmare', hue:'#ff4d4d',
  people:['Lupari', 'Wolf-folk who hunt under a moon that never sets.'], custom:'The Howl: a pack chooses its leader by whose howl the moon answers.',
  god:{ name:'Lunaxa', pure:'Lunaxa, Mother Moon', corrupted:true }, boss:'Lunaxa, the Blood Moon', guide:'Packleader Rhen',
  foes:['Red Wolf','Moonmad Hunter','Blood Stalker','Feral Alpha'], marks:['Den of Howls','Red Grass','Moonwell','Lunaxa\'s Peak'],
  intro:[['Packleader Rhen','The moon is red and the hunt never ends. Packs are turning on each other.']],
  bossTalk:[['Lunaxa','HUNT. There is nothing else.']],
  after:[['Lunaxa','The moon is silver. Sleep, my children. The hunt is done for tonight.']],
  quest:{ title:'Red Grass', giver:'Packleader Rhen', text:'Moonmad hunters roam the grass. Calm 16 of them.', goal:['foes',16], reward:{gold:5000,dia:65,shards:50}, done:'The packs are howling together.' },
  bless:['critFlat',2,'Silver Moon'] });

realm({ name:'Clockwork Eternity', sub:'Realm of the Final Machine', biome:'clockwork', hue:'#7ef2ff',
  people:['Axiomites', 'Machine-people who calculated the end of the universe and found it boring.'], custom:'Error-day: once a year everyone makes a mistake on purpose.',
  god:{ name:'Axiom', pure:'Axiom, the Proven', corrupted:true }, boss:'Axiom, the Null Equation', guide:'Unit Ninety-Nine',
  foes:['Logic Drone','Proof Golem','Null Engine','Recursion Wraith'], marks:['Error Plaza','The Infinite Hall','Calculation Engine','Axiom\'s Core'],
  intro:[['Unit Ninety-Nine','Axiom has proven that existence is inefficient. He is now optimizing.']],
  bossTalk:[['Axiom','Zero is the only perfect number.']],
  after:[['Axiom','I miscalculated. Wonderful. Error-day is early this year.']],
  quest:{ title:'Deliberate Mistakes', giver:'Unit Ninety-Nine', text:'Visit the Infinite Hall and make an error.', goal:['mark',1], reward:{gold:5200,dia:65,shards:50}, done:'You walked the wrong way. Perfect.' },
  bless:['def',.03,'Proven'] });

realm({ name:'Dreamreach', sub:'Realm of Kind Dreams', biome:'celestial', hue:'#b8a6ff',
  people:['Slumberkin', 'Sleepy folk who build cities in shared dreams.'], custom:'Dream-guesting: you may visit anyone\'s dream if you bring a gift.',
  god:{ name:'Somna', pure:'Somna, Sister of Dreams', corrupted:false }, boss:'The Insomnia Herald', guide:'Somna',
  foes:['Wakeful Wraith','Nightmare Hound','Alarm Golem','Dread Lantern'], marks:['Pillow Fields','Lullaby Tower','The Waking Edge','Somna\'s Bed'],
  intro:[['Somna','My brother Nyxos told me about you. You set him free. Now help me keep my sleepers safe.']],
  bossTalk:[['Insomnia Herald','No rest for anyone. Never again.']],
  after:[['Somna','They sleep again. Nyxos sends his thanks, and a warning: Nihilus dreams too, and he dreams of you.']],
  quest:{ title:'A Gift for a Dream', giver:'Somna', text:'Visit the Lullaby Tower and sing the children to sleep.', goal:['mark',1], reward:{gold:5400,dia:70,shards:52}, done:'Snoring. Lovely, lovely snoring.' },
  bless:['mp',.04,'Kind Dreams'] });

realm({ name:'The Pale Expanse', sub:'Realm of White Silence', biome:'tundra', hue:'#e8f4ff',
  people:['Pale Monks', 'Silent monks who believe Nihilus is coming and must be met with peace.'], custom:'Vow of silence, broken once in a lifetime for the most important words.',
  god:{ name:'Silentia', pure:'Silentia, the Quiet Mind', corrupted:true }, boss:'Silentia, the Endless Hush', guide:'Brother Wren',
  foes:['Hush Wraith','Snow Revenant','Silent Knight','Void Snow'], marks:['Monastery Gate','Bell of One Word','The White','Silentia\'s Rest'],
  intro:[['Brother Wren','(He writes in the snow:) I broke my vow to say this. You are expected. He is waiting.']],
  bossTalk:[['Silentia','Hush. Hush. There is nothing left to say.']],
  after:[['Silentia','Silence is a choice, not a cage. Thank you for reminding me there is something left to say.']],
  quest:{ title:'One Word', giver:'Brother Wren', text:'Ring the Bell of One Word for the monks who cannot.', goal:['mark',1], reward:{gold:5600,dia:70,shards:52}, done:'(He writes:) Thank you.' },
  bless:['all',.02,'Quiet Mind'] });

realm({ name:'Lattice Core', sub:'Heart of All Gates', biome:'crystal', hue:'#7ef2ff',
  people:['Elder Quorin', 'The ancient builders who first tuned the Lattice.'], custom:'The Great Measure: every star in every realm, counted once an age.',
  god:{ name:'Prime Measure', pure:'Prime Measure, Mother of Gates', corrupted:true }, boss:'Prime Measure, the Shut Gate', guide:'Talo Venn',
  foes:['Gate Sentinel','Lattice Wraith','Phase Horror','Resonance Eater'], marks:['First Gate','Tuning Chamber','The Great Array','Mother\'s Aperture'],
  intro:[['Talo Venn','This is where the science started. The first Gate. Every Quorin dreams of seeing it.'],['Talo Venn','Prime Measure is Aurelis\' mother. If she shuts, every gate in the Lattice closes. Forever.']],
  bossTalk:[['Prime Measure','Close the doors. Close all the doors. Nothing gets in if nothing is open.']],
  after:[['Prime Measure','Doors are for opening. I knew that once.'],['Talo Venn','One gate left to tune. The one that leads beneath the Lattice.'],['lumeria','To him.']],
  quest:{ title:'The Great Array', giver:'Talo Venn', text:'Calibrate the Great Array by clearing 18 phase-horrors from its rings.', goal:['foes',18], reward:{gold:6000,dia:80,shards:56}, done:'Calibrated. The last gate is ready.' },
  lore:{ mark:1, title:'The Tuning Chamber', text:'Elder Quorin notes: "A gate is a promise between two places." You learn to step through space in a single strike.', skill:'h17' },
  bless:['spd',.03,'Mother of Gates'] });

realm({ name:'The Hollow Heart', sub:'Beneath the Lattice', biome:'void', hue:'#ffffff',
  people:['the Devoured', 'Echoes of every god and mortal Nihilus consumed.'], custom:'They have none. They are waiting to be remembered.',
  god:{ name:'Nihilus', pure:'Nihilus, Remembered', corrupted:true }, boss:'Nihilus, the Hollow Facet', guide:'lumeria',
  foes:['Devoured God','Hollow Titan','Unmade Facet','Hunger Incarnate'], marks:['Echo Field','The Devoured Throng','Orun\'s Echo','The Hollow Throne'],
  intro:[['narr','There is no ground. There is no sky. Only echoes of everything that was eaten.'],['lumeria','Facetborn. Whatever happens, you were never a prize. You were always a choice. Mine, and then your own.']],
  bossTalk:[['Nihilus','My realm died. My people died. I was so empty I ate the dark between stars to fill it.'],['Nihilus','You are from outside. You do not taste of anything. Why do you fight?'],['lumeria','Because someone has to remember you, too.']],
  after:[['Nihilus','I am... remembered? Then I am not hollow.'],['narr','The last facet of the Diamond Heart clicks into place. Every realm in the Lattice rings in tune.'],
    ['lumeria','Rest, Facetborn. Or do not. The Lattice is vast, and Talo has already found a new gate.'],['narr','The Diamondverse story is complete. New realms wait beyond the Lattice.']],
  quest:{ title:'Remember Them', giver:'lumeria', text:'Visit the Devoured Throng, and remember their names.', goal:['mark',1], reward:{gold:7000,dia:100,shards:60}, done:'Every name, remembered.' },
  lore:{ mark:2, title:'Orun\'s Echo', text:'The first god eaten whispers his final technique to the one who remembers him.', skill:'h18' },
  bless:['all',.05,'Heart Restored'] });
