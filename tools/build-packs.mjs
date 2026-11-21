// Generates JSON sources in packs/_source and compiles them into LevelDB packs.
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const MODULE = "intelligent-weapons-ancestry-pf2e";
const TRAIT = "intelligent-weapon";
const PUBLICATION = {
	title: "Battlezoo Ancestries: Classic Creatures",
	authors: "Mark Seifter / Roll For Combat",
	license: "OGL",
	remaster: false,
};

const slugify = (s) =>
	s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const makeId = (key) =>
	createHash("sha1")
		.update(`${MODULE}:${key}`)
		.digest("base64")
		.replace(/[^a-zA-Z0-9]/g, "")
		.slice(0, 16);
const uuid = (pack, id) => `Compendium.${MODULE}.${pack}.Item.${id}`;
const p = (...paras) =>
	paras.map((t) => (/^<(h\d|ul)/.test(t) ? t : `<p>${t}</p>`)).join("");

const packs = { ancestries: [], heritages: [], features: [], feats: [], actions: [] };

function base(pack, name, type, img, system, extra = {}) {
	const _id = makeId(`${pack}:${name}`);
	const doc = {
		_id,
		name,
		type,
		img,
		system: { slug: slugify(name), publication: PUBLICATION, rules: [], ...system },
		effects: [],
		flags: {},
		folder: null,
		sort: 0,
		ownership: { default: 0 },
		_key: `!items!${_id}`,
		...extra,
	};
	packs[pack].push(doc);
	return doc;
}

const ICON = "systems/pf2e/icons/default-icons";
const WEAPON_ICON = "systems/pf2e/icons/equipment/weapons";
const projectAvatarId = makeId("actions:Project Avatar");

// ---------- Ancestry features ----------
const feature = (name, img, desc, { rules = [], actions = null } = {}) =>
	base("features", name, "feat", img, {
		category: "ancestryfeature",
		level: { value: 0 },
		actionType: { value: actions ? "action" : "passive" },
		actions: { value: actions },
		traits: { rarity: "common", value: [] },
		prerequisites: { value: [] },
		description: { value: desc },
		rules,
	});

const livingConstruct = feature(
	"Living Construct",
	"icons/creatures/magical/construct-stone-earth-gray.webp",
	p(
		"As an intelligent weapon character, you possess much greater agency than a normal intelligent weapon, partially because you have a mind, life force, and spirit, while item intelligent weapons often only have a mind. You are a creature, not an object, and you can be affected by effects that work on creatures, not effects that work on objects (except effects that can apply to weapons, listed in your weapon ancestry ability). Your magical energies and life force flow through you, much like the blood of humanoids. As a result, you are a living creature. You don't have the typical construct immunities, can be affected by effects that target a living creature and can recover Hit Points normally via positive energy. Additionally, you aren't destroyed when reduced to 0 Hit Points. Instead, your life energy attempts to keep you alive even in dire straits; you're knocked out and begin dying when reduced to 0 Hit Points.",
		"However, just because you're alive and have a spirit doesn't mean you have the same physiological needs as other living creatures. You don't need to breathe, eat, drink, and you don't need to sleep, but you do still need a daily period of rest, and for most heritages (all except animated weapon), you still need to contend with your wielder's need to breathe, eat, drink, and rest. During your period of rest, you must enter a restful state for 2 hours, which is similar to sleeping, except you are aware of your surroundings and don't take penalties for being unconscious. Much like with sleeping, if you go too long without entering your restful state, you become fatigued and can't recover until you rest for 2 hours."
	)
);

const inanimateMode = feature(
	"Inanimate Mode",
	`${WEAPON_ICON}/dagger.webp`,
	p(
		"If necessary, you can enter an inanimate state as a three-action activity, allowing other creatures (aside from any wielder that is a part of your heritage) to wield you normally as a weapon. In inanimate mode:",
		"<ul><li>You're flat-footed.</li><li>You can't act except to use your activation ancestry feats, to Seek, to Recall Knowledge, and to use another three-action activity to return to your normal state.</li><li>Other creatures can not only carry you, they can wield you normally as a weapon. This doesn't use the rules for riding, grapples, or the like. In inanimate mode, you're simply a weapon being carried by another wielder.</li></ul>",
		"When you're not in inanimate mode, no other creature (aside from any wielder that is a part of your heritage) can wield you, whether they be friend or foe, though they can still carry you along without any trouble, and a creature must succeed at a Perception check against your Deception DC to realize you are more than a normal magic weapon. If you exit inanimate mode while a creature is carrying you, they can no longer wield you, but they can continue to hold onto you. If you're a possessing or symbiotic weapon, they can hold onto you and there's nothing you can do to escape without your wielder. If you're a projecting weapon, you can manifest your avatar to escape. If you're an animated weapon and you exit inanimate mode while a creature is holding you against your will, you're grappled by that creature and can Escape normally.",
		"This ability is meant to be rarely used, such as when needed for a particular circumstance, and isn't ideal for standard use. For rules to play an intelligent weapon that is an item rather than a character and remains inanimate at all times, use the rules on page 93 instead."
	),
	{ actions: 3 }
);

const inanimateEffect = base("actions", "Effect: Inanimate Mode", "effect", `${WEAPON_ICON}/dagger.webp`, {
	description: { value: "<p>You're in inanimate mode and are off-guard. Remove this effect when you return to your normal state.</p>" },
	duration: { value: -1, unit: "unlimited", sustained: false, expiry: null },
	tokenIcon: { show: true },
	unidentified: false,
	traits: { rarity: "common", value: [] },
	level: { value: 0 },
	badge: null,
	rules: [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg" }],
});
inanimateMode.system.selfEffect = {
	uuid: uuid("iw-actions", inanimateEffect._id),
	name: inanimateEffect.name,
};

const weaponAbility = feature(
	"Weapon",
	`${WEAPON_ICON}/longsword.webp`,
	p(
		"While you are also a living creature, you are a level 0 or 1 simple, martial, or advanced weapon, either a common weapon or another weapon to which you have access.",
		"You can be upgraded using most runes (or monster parts from <em>Battlezoo Bestiary</em>) as normal for a weapon of your kind, and you can be affected by spells and abilities that provide similar benefits, such as <em>magic weapon</em>. However, runes or other item upgrades and abilities that depend upon being an object or assume you aren't a creature or are otherwise based on different assumptions (such as runes that set or increase Hardness or object Hit Points, or a hypothetical rune that makes a weapon invincible to all damage in a manner similar to an <em>indestructible shield</em>) don't work. Your GM determines which runes and effects can't apply. Typically, anything that simply makes a weapon better at fighting when you wield it normally works fine. On the other hand, anything that makes a weapon more resilient, harder to destroy, or harder to lose, or that teleports the object around or grants the object mobility (like the <em>dancing</em> rune) are never allowed. The GM might determine it's appropriate to allow you to upgrade yourself into a specific weapon using the above criteria. If your class grants you a special weapon (such as weapon inventor) or is connected to a weapon (such as weapon implement thaumaturge), you can choose yourself for that weapon as long as you meet any other requirements or restrictions imposed by your class.",
		"Whether you were forged with arcane power, were grown with verdant primal energy, were whispered with occult secrets, or were imbued with blessings as a divine weapon, a certain sort of magic was important during your creation. Choose a single magical tradition used in your creation, which is called your “weapon magical tradition.” This is your magical tradition for intelligent weapon feats with the magical trait or that depend on a magical tradition, as well as for monster part imbued properties depending on a magical tradition."
	)
);

// ---------- Ancestry ----------
const ancestryId = makeId("ancestries:Intelligent Weapon");
const featureItems = Object.fromEntries(
	[livingConstruct, inanimateMode, weaponAbility].map((f) => [
		f._id,
		{
			img: f.img,
			name: f.name,
			level: 0,
			uuid: uuid("iw-features", f._id),
		},
	])
);

base("ancestries", "Intelligent Weapon", "ancestry", `${ICON}/ancestry.svg`, {
	hp: 8,
	size: "med",
	speed: 25,
	reach: 5,
	vision: "lowLightVision",
	boosts: {
		0: { value: ["con"], selected: null },
		1: { value: ["str", "dex", "con", "int", "wis", "cha"], selected: null },
	},
	flaws: {},
	languages: { value: ["common"], custom: "" },
	additionalLanguages: {
		count: 1,
		value: [],
		custom:
			"Additional languages equal to 1 + your Intelligence modifier (if it's positive). Choose from the initial language choices of your creator's ancestry (or the creature whose intelligence sparked your own), and any other languages you have access to (such as the languages prevalent in your region). If your creator or the creature that sparked your intelligence was someone without a list of starting languages (such as a <i>Bestiary</i> creature that only speaks a single language and doesn't have an ancestry), or you somehow arose separately from any other creature, work with your GM to determine an appropriate list of languages. In that case, Aklo, Draconic, and the languages of any of the common ancestries that live nearby are all good choices to include. Regardless of your heritage, you can hear and speak languages aloud like other creatures. If your heritage has a wielder, you speak through your wielder's body, and otherwise you speak from your weapon body instead.",
	},
	traits: { rarity: "rare", value: ["construct", TRAIT] },
	items: featureItems,
	description: {
		value: p(
			"<em>In the most exciting stories of heroism, the heroes' weapons stand out, with their names and powers passed down for generations. But sometimes, the weapon <strong>is</strong> the hero. Intelligent weapon characters possess intelligence and a spark of life, allowing them to break beyond the preconceptions of what an “item” can or should do and show the world that they are people like any other.</em>",
			"Intelligent weapon characters have origin stories that vary wildly from weapon to weapon. Some were always intelligent or created that way on purpose. Others were due to a curse or magical accident or even through unintentionally absorbing their creator's or another creature's mind. Or they became intelligent later on—possibly <em>much</em> later. Many cultures have specific legends describing this effect; for instance, oni believe that after 100 years, an object has a chance to gain a spirit and become sapient, and the existence of tsukumogami lends credence to this idea. Even beyond the first awakening to sapience, some intelligent weapons take quite some time before they progress from a normal intelligent weapon to an intelligent weapon <em>character</em> with increased agency and talents as a fighter, wizard, or other class.",
			"Regardless of the timing and origin of an intelligent weapon's awakening to sapience and agency as a character, many intelligent weapons experience a period of exploration and wanderlust after the process is complete. They often wish to learn about the world around them and experience its facets and nuances. However, some intelligent weapons avoid this tendency due to their awakening to intelligence due to incorporating an existing creature's mind (often their creator), so they already have memories of the experiences from their old life.",
			"Intelligent weapon characters sometimes have to be careful—not every society has laws nuanced enough to recognize their agency and dignity as sapient beings, and depending on their heritage, even societies that recognize their rights might ostracize them for manipulating the rights of others.",
			"If you want to play a character whose true form is a magic weapon, you should play an intelligent weapon.",
			"<h2>You Might...</h2>",
			"<ul><li>Have a unique perspective on what it means to be an “object” or a “person.”</li><li>Take the view that a whole (such as a wielder and weapon working in perfect sync) is greater than the sum of its parts.</li><li>Possess qualities related to your weapon's form and function.</li></ul>",
			"<h2>Others Probably...</h2>",
			"<ul><li>Slip back into old habits without reminders, either thinking of you as an “item” or “object” or coming to unconsciously think of the body that wields you as the “real” you.</li><li>Expect that you possess marvelous magical properties in keeping with your intellect and agency.</li><li>Trust that you know your way around a fight.</li></ul>",
			"<h2>Physical Description</h2>",
			"Intelligent weapons look just like weapons of various types, though often surrounded by a visible glow or aura of powerful magic. Depending on their heritage, they might also have a projected avatar that wields them, a vacant body they've possessed, or a wielder who's along for the ride. Each of these is visually distinctive, and the avatars and wielders can be from all sorts of ancestries. Ultimately, this means that despite their commonalities, intelligent weapons have among the greatest visual distinctiveness of all ancestries. Coming to life means that intelligent weapon characters are truly living creatures, complete with a mystical circulatory system that sends glowing magical power and life force throughout their weapon body, and this can lead to telltale signs if a perceptive and knowledgeable scholar investigates their appearance carefully.",
			"<h2>Society</h2>",
			"Intelligent weapons don't awaken in communities with one another, except in extremely rare circumstances, such as an armory where a civilization mass produces intelligent weapons to use in war. Or in a workshop where a lone legendary blacksmith builds the family they never had, one intelligent weapon at a time. Regardless, they often find themselves drawn to each other, curious to share their experiences with others who have the same life experience, one so different from those living around them.",
			"<h2>Arsenals</h2>",
			"Although intelligent weapons can come from various backgrounds and experiences, they often end up with similar ideals and concepts of the world around them. Whether they complete their period of wanderlust, come with memories of an experienced individual, or go about learning in some other way, eventually a newly intelligent weapon develops a more mature perspective on their life. Sometimes, this is a personal philosophy, while other times, it's influenced by other, more experienced, intelligent weapons they met throughout their travels. The first intelligent weapon who codified these different philosophies decided to call them “arsenals,” and the term stuck. Because of the unique experiences of each individual intelligent weapon, there are dozens, if not hundreds, of minor arsenals, but six stand out as especially popular: battleseekers, embodied, itemspeakers, ramblers, smiths, and upgraders.",
			"<h3>Battleseekers</h3>",
			"Weapons are made to fight, and so the greatest thrill and sense of purpose for an intelligent weapon must be in the heat of battle, clashing in mortal combat against another weapon and that weapon's wielder to determine which weapon is stronger and whose skills are greater. Battle is when weapons can truly feel alive. Such is the credo of battleseekers, a popular arsenal among the more hotblooded and martially minded intelligent weapons. Battleseekers tend to include some of the most individually powerful intelligent weapons of any arsenal, but they are often just that: individuals. A given battleseeker is usually much more interested in increasing their own personal skills and testing them out in a fight than they are in advancing the battleseeker arsenal's philosophy in general or teaming up with other battleseekers to achieve a greater goal. In the same vein, when two battleseekers meet, it's almost inevitable that it will come to a fight, at least until they can establish which of the two is stronger. These personality traits have kept the battleseeker arsenal from flexing their combat power against other arsenals, and indeed, most battleseekers see their fighting and increased prowess as more of an end than a means.",
			"This individualism doesn't mean that battleseekers don't team up with other adventurers in order to grow stronger together, though they're much less likely to team up with a rival intelligent weapon than with other ancestries. Adventuring companions of a battleseeker should expect regular duels and sparring matches, especially when the battleseeker or a companion gains an exciting new special move or significant increase in combat ability. This helps the battleseeker continue to hone their strength and gauge their allies' progress in relation to their own. If their allies are outpacing them, the battleseeker must contemplate deeply and determine the cause in order to improve their growth, and if the battleseeker is the one advancing the fastest, they might need to find a way to pull their companions up so they don't stop being useful sparring partners. While others sometimes mistake battleseekers as thoughtless, that's hardly the case; they simply don't care to exercise their intellect toward the same topics as others. When it comes to analyzing fighting styles and combat growth or any other topic that strikes their interest, they can demonstrate exceptional insight.",
			"<h3>Embodied</h3>",
			"Embodied are intelligent weapon characters who come to associate their concept of self so deeply with the body of their wielder (whether it's a projected avatar or another creature's body) that they consider their wielder to be a fundamental part of their identity. For this reason, embodied never have the animated weapon heritage, and they are much less likely to have the symbiotic weapon heritage than they are to have the possessing or projecting weapon heritages. Out of all the arsenals, embodied are the intelligent weapons that can most easily blend into humanoid societies, introducing themselves as their wielder to the extent that sometimes they become famous without anyone ever realizing they're an intelligent weapon.",
			"Of course, in some cases, there's a compelling reason to become an embodied: intelligent weapons possessing the intelligence of their creator or another creature, through accident or intent, often still identify as the original creature in question and wish to have a body to continue this prior identity. This is doubly true if they're projecting an idealized version of their original body or possessing their vegetative original body. In fact, if they were already famous before becoming an intelligent weapon, those around them might not even realize that something happened to them as they continue to live out their former life alongside this “amazing new weapon.” Even if they don't want to continue their old life, an embodied possessing another creature's intelligence might still miss having a physical body.",
			"Embodied tend to be fairly easy to get along with, but they still sometimes quarrel with itemspeakers, as the latter arsenal feels that abandoning what makes intelligent weapons special and unique and consigning other items to mistreatment in order to “blend in” with humanoid society. For their part, most embodied don't have the same issues with itemspeakers as the more quarrelsome itemspeakers do with them, though embodied whose mind originally came from another ancestry might take offense at the idea that they can't or shouldn't identify as a member of their original ancestry.",
			"<h3>Itemspeakers</h3>",
			"Intelligent weapons are some of the few items with a voice that other creatures can hear and understand, but that doesn't mean “mundane” items don't have their thoughts and spirits growing within them. Psychometry or object reading, along with creatures such as tsukumogami or poppets wished to life by a child's love, prove that ordinary objects can become imbued with thoughts, feelings, and even spirits. And just because these items are earlier in the process of developing their inner spirit doesn't mean it's right to disrespect and abuse them.",
			"To an itemspeaker, maliciously ripping off the arms of a cherished doll is akin to tearing off the limbs of a grasshopper. That's not to say that wear and breakage during regular use are a problem; those items are proud of fulfilling their role, and breaking over the long process of their intended use is a respectable fate, especially for those willing to help repair and reuse them rather than toss them aside.",
			"Intelligent weapons of the itemspeaker arsenal feel that their role as weapons that live, think, and speak in the traditional sense is more easily respected and understood by humanoids and other similar creatures, bestows them with a responsibility to speak for all the other items of the world who don't have the same kind of voice. To let people know what their items are feeling—not only will that help the humanoid learn what their treatment of the item could mean if and when the item develops a stronger spirit of its own and comes to life, it's simply the right thing to do, even if the item never progresses beyond faint psychic impressions experienced via psychometry and object reading. While their philosophy makes itemspeakers extremely empathetic and respectful of the agency of the oppressed, it can sometimes lead them to dogmatic views and negative reactions when they come into conflict with those who mock and deride their perspective. Occasionally, a humanoid feeling contrary or annoyed that someone would dare preach this strange philosophy to them begins to wantonly destroy inanimate objects while the itemspeaker watches, just to prove a point, and this can quickly escalate into a violent conflict if the itemspeaker takes the bait.",
			"<h3>Ramblers</h3>",
			"Not every intelligent weapon “grows out” of the wanderlust and desire to experience everything the world has to offer. Intelligent weapons of the rambler arsenal choose to continue their adventures and exploration for the long haul, or even forever, though some eventually transition to another arsenal or develop a hybrid philosophy with another arsenal. Ramblers chose their name because of their desire to aimlessly ramble through the world and see all it has to offer rather than simply go where they must to complete tasks or missions. However, they also <em>love</em> to tell lengthy stories of their travels, sometimes to an excessive degree, and so occasionally other arsenals use the other meaning of “ramble” to tease them for that a bit. Two ramblers who meet on the road often spend days, if not longer, sharing all the stories of their respective adventures as they sit rapt at the edge of their scabbard through every minute.",
			"Along with battleseekers, ramblers are one of the most common arsenals to become adventurers, though they chafe in adventuring parties who are tied to one location or overly focused on a single mission or goal. Exploring what's beyond the unknown hill in a new land is much more interesting to a rambler than heading to the lich's castle to put down an undead uprising, even if they each required an equal amount of travel.",
			"When left to their own devices, ramblers often explore or examine everything around them. While others can get the wrong idea and view ramblers as being absent-minded, in truth, their attention to these details can lead to them noticing secrets or clues that others might miss, even if they weren't listening to the conversation everyone else was having.",
			"<h3>Smiths</h3>",
			"Despite their differences, the intelligent weapons of the world are part of a community, a broader family. And in order to grow this family, the most important work is smithing, specifically learning the unique magical crafting skills necessary to forge more intelligent weapons. The smith arsenal wholeheartedly believes this ideal, and so they strive to increase their understanding of weapons, especially intelligent weapons, in order to grow their family and bring more intelligent weapons into the world. Smiths work constantly and continually to improve their skills and to create ever-greater masterpieces, which they regard as their beloved children.",
			"Artistry and self-expression in their creative work are just as important to many smiths as artisanry and functionality. These smiths believe that the personality and soul of an intelligent weapon built with expressive artistic vision can soar to greater heights than those created formulaically and purely with utility and function in mind. Many smiths similarly refuse to create near-identical weapons, instead preferring to forge a wide array of different weapons, with each unique and distinctive from the rest in both magical and physical properties.",
			"Some smiths get so obsessed with their work that they keep to their own devices, but for most others, the aspiration of belonging and family that guide their forging process makes them friendly, or at least harmless. But those few malevolent smiths are a blight to the world, forging ever-increasing numbers of malicious, cursed intelligent weapons to expand their cruel family and slaughter or dominate other ancestries.",
			"<h3>Upgraders</h3>",
			"Upgraders agree with battleseekers that the pursuit of perfection is worthwhile, but they see the other arsenal as hopelessly naive. Battleseekers are caught up in the idea that the battle is the be-all-end-all, but truly, battles are simply one tool in the toolkit of improving oneself and one of the bluntest, least elegant, and most wasteful tools of the bunch. To an upgrader, the path of self-perfection involves a combination of all possible tools and techniques, focusing especially on ways of becoming stronger that are uniquely available to intelligent weapons. After all, any other ancestry out there can clash and clash with each other and hope to become stronger if they're lucky and persistent, but only intelligent weapons can calmly, methodically upgrade themselves as weapons, spending time and resources to steadily grow stronger without taking unnecessary risks or employing inefficient strategies.",
			"Upgraders don't all agree on what it means to perfect oneself and “upgrade.” While the typical upgrader includes a strong component of magical power in their definition, many also incorporate other factors such as aesthetics, composition, structural integrity, and distinctiveness. Some unusual upgraders couldn't care less about their capacity as a magic weapon and care only about an aesthetic and distinctive appearance, even if such a form makes them less effective when used as a weapon. Other upgraders consider this view to be quite shallow, akin to someone who cares only for the outward physical appearance of others rather than the person's inner self.",
			"Upgraders are always looking for new and unique ways to improve themselves and their capacities, and thus, few upgraders can resist rumors of lost magical weapon techniques, runes, monster part crafting, or other similar processes. In that regard, they can find themselves either teamed up with or in open rivalry against a smith who is after the same techniques to use for their children rather than themself.",
			"<h2>Alignment and Religion</h2>",
			"Intelligent weapons have alignments as varied as any other creature, depending on their circumstances. Like many other ancestries, they tend slightly toward more neutral alignments in a vacuum, but intelligent weapons might spark intellect from an aligned creature or be forged as a holy blade or cursed weapon, granting them an especially extreme alignment, so these circumstances typically even out the odds of any alignment.",
			"Intelligent weapons aren't especially likely to be religious, other than those deriving their sapience from a religious creature or forged as a religious weapon, but those who do deeply venerate a deity have a slight preference toward deities presiding over battle or crafting, such as Lilin the Mother, goddess of artistry and creation, or Zatera, goddess of war. Depending on their arsenal and personal views, intelligent weapons might also worship a wide variety of other deities.",
			"<h2>Names</h2>",
			"Intelligent weapons are often named by their creator with a name sounding more descriptive or fanciful, like a non-intelligent weapon's name, but some creators give a weapon a name from their own ancestry or an especially unusual name. Additionally, some intelligent weapons reject their creator's name and create their own brand new name based on their own identity. Those intelligent weapons who gained the intellect of another creature might take the name of that creature as their own; in fact, depending on their heritage, such an intelligent weapon might be able to pick their life back up right where they left off, with others assuming they found a powerful new weapon instead of realizing they <em>became</em> the weapon.",
			"As a result of all these competing trends, there's no unifying theme to intelligent weapon names, and they can include names as disparate as a single letter or serial number and a perfectly ordinary name from another ancestry. The sample names below are listed for convenience and are meant to show the wide variety of possibilities rather than to be indicative of the full breadth of variety.",
			"<strong>Sample Names</strong> &amp;, Anglachel, Gurthang, Kring, Kullervo, Muramasa, N, Need, Nightblood, Orna, Pyra, Soul, Stormbringer, Survivor, Teacher, Tremble, Umbra, Zangetsu.",
			"<h2>Intelligent Weapon Heritages</h2>",
			"Intelligent weapon characters manifest their agency in different ways, each represented by a different heritage. These heritages have a major impact on how your character interacts with the world and will help determine your character's effective size (the weapon part of your character is always Tiny, but most heritages are usually effectively Medium or Small when active as a character). Choose one of the following intelligent weapon heritages at 1st level. If you choose a versatile heritage instead, decide whether or not you have a wielder. If you don't, use the animated weapon heritage's rules except that you don't gain the ability to float (you slide along the ground), and if you do, use the rules for possessing, projecting, or symbiotic weapon without their special benefit (no benefit from the chosen ancestry if you're possessing a body, no ability to turn on and off the projection if you're projecting a body, and no extra skills or ability to gain ancestry benefits briefly for an action if you're symbiotic with a wielder). Essentially, you gain the trappings of the chosen heritage without the mechanical benefit, plus all the benefits of your versatile heritage.",
			"Whether you're a possessing, projecting, or symbiotic weapon, you have a wielder of some kind, which you, the player, control. You, the intelligent weapon, and the wielder are essentially a single character, with the Hit Points indicated by your Constitution, class, level, and other features “shared” between both the weapon and the wielder. You and your wielder can't be targeted separately, you and your wielder aren't affected twice in an area effect, and so on. Whatever affects you as a weapon also affects the wielder, and your wielder wears any worn items, carries equipment, and so on, granting you the benefit, as you and the wielder are effectively a single creature. However, the way your wielder holds onto the equipment can be inconvenient if you're a possessing or symbiotic weapon separated from your wielder and left without your items, as well as if you're a projecting weapon and you unmanifest your avatar, leaving all the equipment and items your avatar was wearing and carrying on the ground in your space.",
			"In rare instances, a symbiotic weapon might become forcibly separated from their wielder, which makes things slightly more complicated than the rules in the above paragraph; the rules of that heritage indicate how to handle this situation. Possessing and projecting weapons, however, are necessary for their wielder to move (for possessing weapons) or exist (for projecting weapons).",
			"<strong>Improvised Intelligent Weapons?</strong> Improvised weapons can't be magic items, and thus, by the rules, your intelligent weapon can't be an improvised weapon. However, if you'd like to play an intelligent tankard of ale, spoon, or similar object, you could consider working with the GM to find stats for a similar weapon and make your character a non-improvised tankard of ale bespoke weapon, perhaps based on the statistics of a club. As a true weapon, not an improvised weapon, you would use the normal rules for manufactured weapons and would not be eligible for the weapon improvisor archetype and similar mechanics."
		),
	},
});

// ---------- Heritages ----------
const heritage = (name, desc, rules = [], traits = []) =>
	base("heritages", name, "heritage", `${ICON}/heritage.svg`, {
		ancestry: {
			name: "Intelligent Weapon",
			slug: TRAIT,
			uuid: uuid("iw-ancestries", ancestryId),
		},
		traits: { rarity: "common", value: traits },
		description: { value: desc },
		rules,
	});

heritage(
	"Animated Weapon",
	p(
		"Who needs a wielder? You wield yourself! You're a Tiny weapon, or a Small weapon if you're a weapon at least 3 feet long, that moves on your own. Usually, you float slightly off the ground or other solid surface: you're not flying (and thus don't need to take the Fly action each round), and on a battle map, you're still occupying a square on the ground level, but you don't touch the surface unless you choose to do so, which might allow you to avoid pressure plate hazards along the ground. Usually, you're not high enough to avoid difficult terrain from undergrowth and other types that extend from the ground, but you might be able to avoid uneven ground and difficult terrain due to footing. This doesn't allow you to float over water and other non-solid surfaces, and you can land on purpose or be forced to the ground and fall prone, such as by the Trip action. You still take falling damage as normal after a fall before beginning to float again when you Stand.",
		"Because you don't have a body, you can't take Interact actions (other than those involving Interacting with your own weapon body) or wield or hold anything, and you don't have fists or other body parts that can normally make unarmed attacks by default (though you might be able to gain them via spells or other abilities that specifically grant you an unarmed attack). You can Invest worn items despite not having a body. If you do, they transform into visual artistic representations on your weapon and meld into you while they're invested and you remain conscious, spilling out when you fall unconscious or no longer Invest in them. You still must follow the normal rules preventing you from Investing multiple items with the same Worn entry, and other creatures who examine you might notice that the visual representations are stored items. If you're a ranged weapon, you can meld and provide your own ammunition in the same way, including special ammunition, and you can Interact with special ammunition if necessary to Activate it. Lastly, you can install protective armored paneling or plating on yourself with the same price and statistics as armor. If you invest a suit of magic armor made for another ancestry, when it merges with you, it forms into a set of protective plating with the same effects.",
		"<strong>Animated Weapon Limitations</strong> While the ability to float allows you to avoid quite a few hindrances on the battlefield, the lack of a free hand is a major limitation for animated weapons that helps balance out that powerful benefit. As a result, however, animated weapons are much better off choosing to be a weapon that uses two hands (or “1+” hands, like a bow), and they have a lot of trouble as thaumaturges, alchemists, or other classes heavily reliant on having a free hand."
	),
	[{ key: "CreatureSize", value: "tiny" }]
);

heritage(
	"Possessing Weapon",
	p(
		"You found a vacant body, perhaps an unused clone from a magic ritual, or a creature whose body remained alive after the soul and mind were extracted. It might even have been a creature about to die when its body formed a bond with you on the cusp of death after the soul departed. Whatever the case, you have a deep connection with and full control over the body, essentially using it as your own. Choose a Small or Medium ancestry that can wield you. You possess the body of a creature of that ancestry and can act through that body and share your life force; you are one creature, and you can't be Disarmed or otherwise separated unless you choose to do so by entering inanimate mode. This body needs the standard amount of air, food, water, and sleep for the chosen ancestry, and due to your connection, you need to remain in your restful state for 8 hours as well. You lose low-light vision but gain the base abilities of the chosen ancestry (which might include low-light vision or darkvision) while controlling the possessed body. When you're in inanimate mode to allow another person to wield you, the possessed body remains insensate and can't act; it's vulnerable in this state and can be destroyed easily by any creature who comes upon it. If you die while in inanimate mode, the possessed body typically dies shortly thereafter, either from starvation or thirst. Even if someone provides the body with water and food, it will die a few days later from the lack of your life force to keep its internals running.",
		"Some evil intelligent weapons might want to use this heritage while suppressing the will of a sapient creature still residing within their body. While this can be successful with the right group and theme, check with everyone in your group first before pursuing this narrative path."
	)
);

heritage(
	"Projecting Weapon",
	p(
		"Whether it's an idealized form based on your self-conception or a ghostly echo of the form of the creature whose spirit and mind infused you and made you what you are, you can project an avatar to wield you and interact with the world around you. Choose a Small or Medium ancestry that can wield you. You gain the Project Avatar action, which allows you to manifest or unmanifest your avatar in your space (or an adjacent space if you were already in a creature's space). When entering inanimate mode, you also automatically unmanifest your avatar, if it was manifested, and when exiting inanimate mode, you can form your avatar as part of the three-action activity. When you don't have an avatar, but you choose not to enter inanimate mode, you're flat-footed and you can't act except to use your activation ancestry feats, to Seek, to Recall Knowledge, and to manifest your avatar.",
		"Your avatar appears to be a member of the chosen ancestry, though it doesn't have any of the ancestry's abilities. You can act via your avatar, effectively gaining all the capabilities of a creature of that size, and your avatar shares your life force and fate; you are one creature, and you can't be Disarmed or otherwise separated unless you choose to do so by entering inanimate mode or unmanifesting your avatar. Your avatar needs to breathe, and it eventually needs to eat, drink, or sleep over time if it remains manifested, though you can unmanifest it to avoid any of these needs. While unmanifested for 2 hours during your rest period, you can provide magical energy to help your avatar meet its daily needs to eat, drink, and sleep, so these needs will be only a hindrance if they occur on a shorter-term basis (for instance, if it's hot enough, or if a creature uses a special ability, your avatar might need to drink something right away or risk dehydration).",
		"Some evil intelligent weapons might want to use this heritage while suppressing the will of a sapient creature still residing within their body. While this can be successful with the right group and theme, check with everyone in your group first before pursuing this narrative path."
			),
			[{ key: "GrantItem", uuid: uuid("iw-actions", projectAvatarId) }]
		);

heritage(
	"Symbiotic Weapon",
	p(
		"You have an unremarkable, combat neophyte wielder with whom you've deeply bonded. They might or might not realize you're intelligent and capable of influencing their body to drive them to greater heights; if they're unaware, they might write your influence off as an increase in performance and better decision-making due to adrenaline or being “in the zone.” Choose a Small or Medium ancestry that can wield you. You're subtly or not-so-subtly guiding a creature of that ancestry and can act through their body and share your life force (to keep them alive); you are one creature for almost all purposes, using your own (superior) statistics, and you can't be Disarmed or otherwise separated unless you choose to do so by entering inanimate mode. However, as a player, you should roleplay the weapon and wielder separately. The wielder's body needs the standard amount of air, food, water, and sleep for the chosen ancestry, though the weapon only needs to enter a restful state for 2 hours and could be plotting and planning for the remaining time. Normally, you can't use any base benefits granted by the wielder's ancestry (such as darkvision for a dwarf wielder), as those are difficult to sync up. However, as a single action, which has the concentrate trait, you can use all ancestry benefits for 1 round. You can take this action repeatedly as an exploration activity if necessary (for instance, to maintain darkvision in a dark area).",
		"Even though the wielder is essentially a noncombatant on their own, they're good at one non-athletic task, and they use their journey with you to continue improving. Choose an Intelligence, Wisdom, or Charisma-based skill, as well as a Lore skill. You gain the Additional Lore feat for the Lore skill and become trained in the other chosen skill. However, the wielder is the one using and improving those skills. For instance, a wielder who was a farmer might choose Nature (learned while taking care of the animals) and Farming Lore, while a baker might choose Crafting and Baking Lore. For extra roleplay potential, consider choosing a Charisma-based skill such as Deception (for a wielder who knows you're the one improving their combat skills but wants to fool others into thinking they know what they're doing). Symbiotic weapons rarely enter inanimate mode to allow another character to wield them, as this leaves their bonded wielder without any of the improved statistics from the bond and, thus, extremely vulnerable to being killed. If it becomes necessary to do so due to the circumstances of the campaign, you and the GM can work together to build combat statistics for a level –1 NPC, though they retain their modifier for the chosen skill and Lore skill. At the GM's discretion, they could instead choose to have the wielder use the level 0 character variant rule without choosing an apprentice option, with the exception of the chosen skill and Lore skill modifiers.",
		"Some evil intelligent weapons might want to use this heritage while suppressing the will of a sapient creature still residing within their body. While this can be successful with the right group and theme, check with everyone in your group first before pursuing this narrative path."
	)
);

// ---------- Actions ----------
base("actions", "Project Avatar", "action", `${ICON}/action.svg`, {
	actionType: { value: "action" },
	actions: { value: 1 },
	category: "",
	traits: { rarity: "common", value: ["concentrate"] },
	description: {
		value: p(
			"<strong>Requirements</strong> You have the projecting weapon heritage.",
			"You manifest an avatar in your space (or in an adjacent space if you were already in a creature's space) or unmanifest your currently manifested avatar. When your avatar manifests, it appears wielding you or with you stowed, whichever you choose; if another creature was previously holding you, it's no longer holding you, and your avatar is holding you instead. The avatar appears in your space, which could mean it appears in a dangerous location (for instance, if a monster swallows you in inanimate mode, your avatar appears inside the monster)."
		),
	},
});

// ---------- Feats ----------
const T = TRAIT;
function feat(name, level, o = {}) {
	const {
		traits = [],
		prereq = [],
		action = null,
		freq = null,
		desc,
		rules = [],
	} = o;
	const actionType = action === null ? "passive" : action === "reaction" ? "reaction" : action === "free" ? "free" : "action";
	return base("feats", name, "feat", `${ICON}/feat.svg`, {
		category: "ancestry",
		level: { value: level },
		actionType: { value: actionType },
		actions: { value: typeof action === "number" ? action : null },
		traits: { rarity: "common", value: [...traits, T].sort() },
		prerequisites: { value: prereq.map((value) => ({ value })) },
		frequency: freq,
		onlyLevel1: false,
		maxTakable: 1,
		description: { value: desc },
		rules,
	});
}
const perDay = { max: 1, per: "day" };
const perHour = { max: 1, per: "PT1H" };

// Level 1
feat("Darkseer Weapon", 1, {
	prereq: ["low-light vision"],
	desc: p("You've enhanced the senses you received during your creation, allowing you to see in the dark. You gain darkvision. As a reminder, due to losing low-light vision, a possessing weapon can't gain the benefit of this feat unless they're possessing a creature with low-light vision (and if they're possessing a creature with darkvision, this feat doesn't provide them any benefit)."),
	rules: [{ key: "Sense", selector: "darkvision" }],
});
feat("Defensive Discorporation", 1, {
	action: "reaction",
	prereq: ["projecting weapon heritage"],
	freq: { max: 1, per: "PT10M" },
	desc: p(
		"<strong>Trigger</strong> An enemy's Strike against you is a critical hit.",
		"When your foe delivers a telling blow to your projected avatar, instead of taking the wound, you discorporate your avatar. You unmanifest your avatar, and the triggering attack deals only the amount of damage it would normally deal on a hit (typically full damage instead of double damage). Any other effects caused by a critical hit still occur. As normal, with your avatar unmanifested, you're flat-footed and you can't act except to use your activation ancestry feats, to Seek, to Recall Knowledge, and to manifest your avatar."
	),
});
feat("Enhanced Storage", 1, {
	prereq: ["animated weapon heritage"],
	desc: p("You can store more items within you in the same way as your invested items. You can store items up to the limit of your light load limit (typically 5 plus your Strength modifier), though any armor plating you have and any melded invested items and ammunition count against this limit."),
});
feat("Hidden Mind", 1, {
	action: "free",
	traits: ["fortune"],
	prereq: ["possessing weapon or symbiotic weapon heritage"],
	freq: perDay,
	desc: p(
		"<strong>Trigger</strong> You fail a Will saving throw.",
		"You take advantage of the ambiguous or hidden nature of your true intelligence to shunt off an effect assailing your will to your possessed body or symbiotic wielder. Reroll the failed saving throw and take the better result. You gain a +1 circumstance bonus to the reroll if you're a possessing weapon, or a +2 circumstance bonus if you're a symbiotic weapon, since there's more of your wielder to distract the triggering effect. However, when you use Hidden Mind as a symbiotic weapon, if the second roll is a success, your wielder diffuses the effects for you and you can't use the skills granted by your wielder from your heritage for 10 minutes until they will recover."
	),
});
feat("Intelligent Weapon Lore", 1, {
	desc: p(
		"In your quest to understand your origins (or in your previous life as a weaponsmith whose mind and spirit entered a weapon), you've learned much about the mysteries of intelligent weapons and how to create them. You gain the trained proficiency rank in Crafting and the skill associated with your weapon magical tradition (Arcana for arcane, Religion for divine, Occultism for occult, and Nature for primal). If you would automatically become trained in one of those skills (from your background or class, for example), you instead become trained in a skill of your choice. You gain the Additional Lore feat in Intelligent Weapon Lore."
	),
});
feat("Reject the Unworthy", 1, {
	action: 1,
	traits: ["activation"],
	freq: { max: 1, per: "round" },
	desc: p(
		"Whether you're a divine weapon with a mission meant only for the worthy or simply choosy about your partners, even when you're in inanimate mode, you can punish the unworthy who dare to try and wield you. The creature wielding you in inanimate mode (or wielding you if you're playing as an item) takes 1d6 force damage for every level you have with a basic Will save. You can choose to force them to drop you."
	),
});
feat("Self Proficiency", 1, {
	desc: p(
		"You know how to wield yourself inherently due to your nature as an intelligent weapon. If you're a martial weapon, then for the purpose of determining your proficiency, you're a simple weapon. If you're an advanced weapon, for the purpose of determining your proficiency, you're a martial weapon. This doesn't affect your proficiency in other weapons of your same kind. At 5th level, whenever you get a critical hit with yourself, you get its critical specialization effect."
	),
});
feat("Shining Weapon", 1, {
	traits: ["activation"],
	desc: p(
		"Like many of the most famous and powerful weapons, you can glow with a brilliant nimbus of color. You can constantly glow, with the effects of the <em>light</em> spell, glowing a color of your choice. You can spend a single action, which has the concentrate trait, to stop the glow or to start it again; this is an activation."
	),
});
feat("Spellblade", 1, {
	traits: ["activation"],
	desc: p(
		"You're infused with magical energy that allows you to produce a simple spell as often as you like. Choose a cantrip from your weapon magical tradition (see the weapon ancestry ability on page 84). You can use this cantrip as a Cast a Spell activation at will. The activation uses your spell DC. You become trained in spell attack rolls and spell DCs for spells of your weapon magical tradition if you weren't already, and your spellcasting ability score is your choice of Intelligence, Wisdom, or Charisma."
	),
});

// Level 5
feat("Fling Self", 5, {
	action: 1,
	traits: ["move"],
	prereq: ["animated weapon heritage"],
	freq: perHour,
	desc: p("You fling yourself through the air at a distance. You fling yourself 30 feet in a straight line in any direction, even straight up. You can land into a normal hover immediately or fall after using your next action; you choose when you fling yourself."),
});
feat("Guiding Strike", 5, {
	action: 1,
	traits: ["concentrate", "divination", "fortune", "magical"],
	freq: perDay,
	desc: p("You focus on your movements as a weapon and analyze every possibility before attacking. The next time you make an attack roll before the end of your turn, roll the attack twice and use the better result. The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being concealed or hidden."),
});
feat("Disguise Quality", 5, {
	action: 2,
	traits: ["activation", "illusion", "magical", "visual"],
	desc: p("You can disguise your quality and appearance to befuddle those who look upon you. Decide what sort of disguise you wish to place on yourself. You can make yourself look decrepit, appearing broken and shoddy. You can make yourself look perfect, appearing as though you're brand new and highly polished or well maintained. You can also make other similar disguises, as determined by the GM. The illusion lasts until you use Disguise Quality to end it or change your disguise. A creature that Interacts with you can attempt to disbelieve the illusion (the DC is equal to the higher of your class DC or spell DC)."),
});
feat("Precious Synthesis", 5, {
	prereq: ["you're a weapon made partially or entirely of metal and not a projectile weapon"],
	desc: p("You either incorporate one of the more inexpensive precious metals into your composition or mirror that precious metal's mystical properties through your own mystical growth as an intelligent weapon. Choose either cold iron or silver. You are treated as the chosen type of precious metal to determine the effects of weaknesses, resistances, and the like."),
});
feat("Reforge Self", 5, {
	desc: p("Each day, you can reshape your magic into your own form to alter your shape, reforging yourself as a different kind of level 0 or 1 weapon to which you have access. During your daily preparations, you can change what kind of weapon you are. This might cause some of your runes, feats, or similar abilities to lose their effects if you are no longer an appropriate kind of weapon to gain the benefit of those runes, feats, or similar abilities. For example, if you have the <em>wounding</em> rune and cease to be a piercing or slashing melee weapon, you would gain no benefit from it. If your GM allows you to gain the benefits of a specific weapon, you can't use this feat to change to a different kind of weapon."),
});
feat("Wielder Synergy", 5, {
	prereq: ["possessing weapon, projecting weapon, or symbiotic weapon heritage"],
	desc: p("You've gained such a powerful and inseparable synergy with your possessed, projected, or symbiotic wielder that you can access more of your ancestry's teachings and abilities for your own purposes. You gain the Adopted Ancestry general feat for the ancestry matching your wielder, and you also gain one 1st-level ancestry feat from your wielder's ancestry."),
});

// Level 9
feat("Distant Projection", 9, {
	prereq: ["projecting weapon heritage"],
	desc: p("When you manifest your avatar, you can do so at a distance, rather than being required to form your avatar within your own space. Your avatar can appear anywhere within 30 feet of you that you can see and to which you have a clear line of effect, and then once it appears, you're pulled in a straight line directly into your avatar's hands. Your movement into your avatar's hands has the move trait; if something disrupts your movement into your avatar's hand, your avatar winks out and you fall to the ground at the spot where the movement was disrupted."),
});
feat("Elusive Mind", 9, {
	prereq: ["Hidden Mind"],
	desc: p("You can shunt effects to your wielder more often than normal. You can use your Hidden Mind action once per hour, instead of once per day."),
});
feat("Flying Weapon", 9, {
	action: 2,
	prereq: ["animated weapon heritage"],
	freq: perHour,
	desc: p("You concentrate additional magical energy into the circulation through your weapon body that keeps you floating, allowing you to fly for a brief time until you recharge the power again. You gain a fly Speed equal to your Speed for 1 minute."),
});
feat("Hindering Weapon", 9, {
	prereq: ["you are a melee weapon"],
	desc: p("You've adjusted yourself through training and reshaping to take advantage of one of three possible hindering maneuvers. You gain your choice of the disarm, shove, or trip traits."),
});
feat("Instinctive Strikes", 9, {
	action: 2,
	traits: ["activation"],
	freq: perHour,
	desc: p("You connect to your instincts as a weapon and the power of <em>speed</em> weapons, causing you to swing, stab, or shoot effortlessly. Make a Strike with yourself. For 1 minute, you're quickened, and you can use the extra action to make a Strike with yourself. If you're in inanimate mode or you're an item intelligent weapon, you don't make a Strike, and your wielder gains the quickened condition instead of you."),
});
feat("Merciful Weapon", 9, {
	desc: p("The magic within you wasn't meant to take lives. You gain the nonlethal trait, though you can choose to either keep or suppress the trait each time you Strike or another creature Strikes with you."),
});
feat("Second Synthesis", 9, {
	prereq: ["Precious Synthesis"],
	desc: p("You incorporate multiple forms of precious metal into your composition at once. You are treated as both cold iron and silver to determine the effects of weaknesses, resistances, and the like, instead of just the precious metal you chose when you took Precious Synthesis."),
});
feat("Self Repair", 9, {
	desc: p("While living intelligent weapons are normally repaired via healing or Medicine like other living creatures, you've found a way to repair yourself like an item, and you do so automatically while at rest. You can use Crafting, instead of Medicine, to Treat Wounds on yourself. If you rest for 10 minutes, you repair yourself automatically, gaining Hit Points equal to your Constitution modifier &times; half your level. This is cumulative with any healing you receive from Treat Wounds. You still can't regain Hit Points from the Repair action, as normal."),
});
feat("Spellblade Adept", 9, {
	traits: ["activation"],
	prereq: ["Spellblade"],
	desc: p("You've focused your magical energies and gained access to more powerful activations. Select one 1st-level spell and one 2nd-level spell, each of your weapon magical tradition. They must be spells to which you have access. You can use each of your chosen spells once per day as Cast a Spell activations. The activations use your spell DC."),
});
feat("Warding Strikes", 9, {
	action: 2,
	traits: ["abjuration", "magical"],
	freq: perDay,
	desc: p(
		"You ward off your foe's attacks with a string of attacks infused with mystical energy. Make a melee Strike with yourself against a foe. In addition to the normal effects of the Strike, it has the effects below, for up to 1 minute. The effect ends early if the foe you attacked dies or at the end of any turn in which you didn't hit that foe with a melee Strike.",
		"<strong>Critical Success</strong> You gain a +3 status bonus to AC against the foe for 1 round and a +2 status bonus to AC against the foe until the effect ends.",
		"<strong>Success</strong> You gain a +2 status bonus to AC against the foe until the effect ends.",
		"<strong>Failure</strong> You gain a +1 status bonus to AC against the foe until the effect ends.",
		"<strong>Critical Failure</strong> You gain no additional effect."
	),
});

// Level 13
feat("Adamantine Synthesis", 13, {
	prereq: ["you're a non-projectile weapon made of metal"],
	desc: p("You incorporate an alloy of the skymetal adamantine or some of adamantine's mystical properties into your composition. You are treated as if you were adamantine to determine the effects of weaknesses, resistances, and the like."),
});
feat("Dilating Projection", 13, {
	prereq: ["projecting weapon heritage"],
	desc: p("When you manifest your avatar, you can project it at a different size by dilating your magic. Choose between your avatar's normal size or an avatar with the effects of <em>enlarge</em> (a Large avatar) or <em>shrink</em> (a Tiny avatar). This lasts until you manifest an avatar of a different size."),
});
feat("Insidious Weapon", 13, {
	prereq: ["possessing or symbiotic weapon heritage"],
	desc: p("You can elude all sorts of magical effects that make attempts to discern information about your true nature by sending them to affect your wielder instead of you. Detection and revelation effects detect or reveal the results appropriate for your wielder, rather than the true information about you, unless the effect has a counteract level higher than your own. Because a possessing weapon's wielder is a vacant body, this might still yield suspicious results, depending on the effect. For instance, spells and special senses that read thoughts would reveal your wielder's thoughts (or no thoughts for a possessing weapon) rather than your own. As another example, unless your wielder has the magical trait or a similar trait (which most wielders do not), this prevents detection effects from determining that you're magical."),
});
feat("Quick Reforge", 13, {
	prereq: ["Reforge Self"],
	desc: p("You can reforge yourself so rapidly, the process of transforming yourself is complete in the time it takes others to merely recover their focus or take a short breather. In addition to reforging yourself during your daily preparations with the Reforge Self feat, you can reforge yourself as a 10 minute activity, which has the concentrate and manipulate traits."),
});
feat("Soaring Weapon", 13, {
	prereq: ["Flying Weapon"],
	desc: p("You can fly freely and when you use additional magic energy, you fly faster. You permanently gain a fly Speed equal to your Speed, and when you use the Flying Weapon feat, you gain a +20-foot status bonus to your fly Speed for 1 minute instead of gaining a fly Speed for 1 minute."),
});
feat("Spellblade Master", 13, {
	traits: ["activation"],
	prereq: ["Spellblade Adept"],
	desc: p("You've mastered your magical energies, granting you more powerful spells to use as activations. Select one 3rd-level spell and one 4th-level spell, each of your weapon magical tradition. They must be spells to which you have access. You can use each of your chosen spells once per day as Cast a Spell activations. The activations use your spell DC."),
});
feat("Storm of Duplicates", 13, {
	action: 2,
	traits: ["activation", "evocation", "magical"],
	freq: perHour,
	desc: p("You create a storm of duplicates of yourself and swing, stab, or shoot them in a cone, line, or emanation. Choose a 30-foot cone, 10-foot emanation, or 60-foot line. Creatures in the area take damage equal to your weapon damage dice, plus one additional weapon damage die, without any other bonuses, penalties, or modifiers. They each attempt a basic Reflex save against the higher of your class DC and spell DC. A creature who critically fails their save takes any critical specialization effect and extra deadly or fatal damage, similarly to if you critically hit them."),
});

// Level 17
feat("Animated Hardness", 17, {
	prereq: ["animated weapon heritage"],
	desc: p("Your powerful magic infuses your body's outer shell, providing you hardness until you suffer enough physical trauma to break through. You gain 5 Hardness, but you lose the Hardness after taking a critical hit or after your Hit Points fall below half your maximum Hit Points. You regain your lost Hardness after you recover up to your maximum Hit Points."),
});
feat("Orichalcum Synthesis", 17, {
	prereq: ["you're a weapon made partially or entirely of metal and not a projectile weapon"],
	desc: p("You incorporate fragments of the legendary skymetal orichalcum, or else some of its mystical time-bending properties, into the composition that makes up your weapon body. You are treated as orichalcum when determining the effects of weaknesses, resistances, and the like."),
});
feat("Perfect Attunement", 17, {
	action: 2,
	traits: ["activation", "divination", "magical"],
	freq: perDay,
	desc: p("You attune yourself so perfectly to the way your weapon body is able to move and attack that you are able to grant yourself unparalleled offensive abilities when using yourself as a weapon, for a short time. You gain a +3 status bonus to attack rolls and damage rolls with yourself, which lasts for 1 minute. Then make a Strike with yourself. If you're in inanimate form or you're an item intelligent weapon, you can't make a Strike, and you grant the status bonus to your wielder instead of yourself."),
});
feat("Spellblade Supremacy", 17, {
	traits: ["activation"],
	prereq: ["Spellblade Master"],
	desc: p("You've reached the apex of channeling your mystic energies into magical activations. Select one 5th-level spell and one 6th-level spell, each of your weapon magical tradition. They must be spells to which you have access. You can use each of your chosen spells once per day as Cast a Spell activations. The activations use your spell DC."),
});
feat("Wall of Duplicates", 17, {
	action: 3,
	traits: ["activation", "evocation", "magical"],
	freq: perHour,
	desc: p("You create a wall of duplicates of yourself that attack anyone who tries to pass through. The wall is a straight line 20 feet high, 120 feet long, and 2 inches thick that appears anywhere within 120 feet, and it provides cover. The wall deals damage equal to your weapon's damage dice plus two additional weapon damage dice (without any bonuses, penalties, or modifiers) to each creature that's in the wall's space when it is created, that attempts to pass through the wall, or that ends its turn inside the wall. A basic Reflex save reduces the damage. A creature that succeeds at this save when the wall is created is pushed to the nearest space on the side of its choice. Creatures trying to move through the wall fail to do so if they critically fail the save, ending their movement adjacent to the wall. A creature who critically fails their save also takes any critical specialization effect and extra deadly or fatal damage, similarly to if you critically hit them."),
});

// ---------- Write & compile ----------
const names = {
	ancestries: "iw-ancestries",
	heritages: "iw-heritages",
	features: "iw-features",
	feats: "iw-feats",
	actions: "iw-actions",
};

rmSync("packs", { recursive: true, force: true });
for (const [key, docs] of Object.entries(packs)) {
	const src = `packs/_source/${names[key]}`;
	mkdirSync(src, { recursive: true });
	for (const doc of docs) {
		writeFileSync(`${src}/${slugify(doc.name)}.json`, JSON.stringify(doc, null, "\t") + "\n");
	}
	await compilePack(src, `packs/${names[key]}`);
	console.log(`${names[key]}: ${docs.length} documents`);
}
