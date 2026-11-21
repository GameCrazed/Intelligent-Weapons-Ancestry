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
const p = (...paras) => paras.map((t) => `<p>${t}</p>`).join("");

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
	`${ICON}/character.svg`,
	p(
		"You are a creature, not an object. Effects that work on creatures affect you (effects that work on objects don't, except those that apply to weapons), and you lack typical construct immunities. You recover Hit Points normally from positive energy.",
		"You aren't destroyed at 0 Hit Points; you're knocked out and begin dying instead.",
		"You don't need to breathe, eat, drink or sleep, but you need a daily rest of 2 hours spent in a restful state in which you stay aware of your surroundings. Go too long without it and you become fatigued. Unless you are an animated weapon, you still contend with your wielder's need to breathe, eat, drink and rest."
	)
);

const inanimateMode = feature(
	"Inanimate Mode",
	`${WEAPON_ICON}/dagger.webp`,
	p(
		"As a three-action activity, you can become inanimate so other creatures (other than a wielder that is part of your heritage) can wield you as a normal weapon.",
		"In inanimate mode you're flat-footed and can't act except to use activation ancestry feats, Seek, Recall Knowledge, or return to your normal state (a three-action activity). Other creatures can carry and wield you normally.",
		"Outside inanimate mode, no other creature (aside from a wielder that is part of your heritage) can wield you, though they can carry you. A creature must succeed at a Perception check against your Deception DC to realize you are more than a normal magic weapon. If a creature holds you when you exit inanimate mode: a possessing or symbiotic weapon can't escape without their wielder; a projecting weapon can manifest an avatar to escape; an animated weapon is grappled and can Escape normally.",
		"This ability is meant for rare use."
	),
	{ actions: 3 }
);

const weaponAbility = feature(
	"Weapon",
	`${WEAPON_ICON}/longsword.webp`,
	p(
		"While also a living creature, you are a level 0 or 1 simple, martial or advanced weapon, either common or one to which you have access.",
		"You can be upgraded with most runes (or monster parts) like a normal weapon of your kind and can be affected by spells such as <em>magic weapon</em>. Runes or abilities that depend on being an object, or that grant resilience, hardness, mobility (like <em>dancing</em>) or teleport you, don't work; the GM decides. If your class grants or relies on a special weapon (weapon innovation, weapon implement), you can choose yourself.",
		"Choose a single magical tradition used in your creation, your <strong>weapon magical tradition</strong>. It is your tradition for intelligent weapon feats with the magical trait or that depend on a tradition, and for monster part properties that depend on a tradition."
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
			"Plus your Intelligence modifier (if positive). Choose from your creator's ancestry (or the creature whose mind sparked your own) or other languages you have access to.",
	},
	traits: { rarity: "rare", value: ["construct", TRAIT] },
	items: featureItems,
	description: {
		value: p(
			"Intelligent weapon characters are people whose true form is a magic weapon, with a spark of life and agency that lets them break beyond what an \"item\" can do. Their weapon body is always Tiny, but most heritages let them act through a projected avatar, a possessed body, a symbiotic wielder, or by wielding themselves.",
			"<strong>Hit Points</strong> 8. <strong>Size</strong> see heritage (Tiny weapon; effectively Small or Medium when active). <strong>Speed</strong> 25 feet. <strong>Ability Boosts</strong> Constitution, free. <strong>Traits</strong> Construct, Intelligent Weapon. <strong>Low-Light Vision</strong>.",
			"<strong>Arsenals</strong> (philosophies): battleseekers, embodied, itemspeakers, ramblers, smiths and upgraders.",
			"<strong>Versatile heritage:</strong> if you take one, decide whether you have a wielder. If not, use the animated weapon rules but you can't float (you slide along the ground). If you do, use the possessing, projecting or symbiotic rules without their special benefit.",
			"<em>See Battlezoo Ancestries: Classic Creatures for the full ancestry.</em>"
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
		"You wield yourself and move on your own. You're a Tiny weapon, or a Small weapon if at least 3 feet long. You float slightly above the ground (you aren't flying and needn't Fly); you still occupy a ground-level space, can avoid pressure plates, and can land on purpose or be forced prone. You still take falling damage.",
		"You have no body: you can't Interact (except with your own weapon body), wield or hold anything, and have no unarmed attacks by default. You can Invest worn items, which meld into your body as artistic decoration while invested and conscious. You can store items inside yourself the same way, and can meld and provide your own ammunition. You can also install armor plating with the price and statistics of armor; invested armor becomes protective plating with the same effects.",
		"Animated weapons do best as two-handed weapons and struggle with classes that need a free hand."
	),
	[{ key: "CreatureSize", value: "tiny" }]
);

heritage(
	"Possessing Weapon",
	p(
		"You control a vacant body. Choose a Small or Medium ancestry that can wield you; you act through a body of that ancestry and share life force with it. You are one creature and can't be Disarmed or separated except by entering inanimate mode.",
		"The body needs standard air, food, water and sleep for its ancestry, and you rest for 8 hours. You lose low-light vision but gain the base abilities of the chosen ancestry (such as low-light vision or darkvision) while controlling the body.",
		"In inanimate mode the body is insensate and vulnerable; if you die in that state it typically dies soon after. Talk with your group before playing a weapon that suppresses a sapient creature's will."
	)
);

heritage(
	"Projecting Weapon",
	p(
		"You project an avatar to wield you. Choose a Small or Medium ancestry that can wield you. Your avatar looks like that ancestry but has none of its abilities. You gain the <strong>Project Avatar</strong> action. You are one creature with your avatar and can't be Disarmed or separated except by entering inanimate mode or unmanifesting your avatar.",
		"Entering inanimate mode unmanifests your avatar; exiting lets you form it as part of the activity. Without an avatar (and not in inanimate mode) you're flat-footed and can only use activation feats, Seek, Recall Knowledge, and manifest your avatar.",
		"Your avatar must breathe and eventually eat, drink and sleep while manifested; while it is unmanifested during your 2-hour rest you provide magical energy to meet those daily needs."
			),
			[{ key: "GrantItem", uuid: uuid("iw-actions", projectAvatarId) }]
		);

heritage(
	"Symbiotic Weapon",
	p(
		"You have an unremarkable, combat-neophyte wielder you've bonded with, who may or may not know you're intelligent. Choose a Small or Medium ancestry that can wield you. You act through them and share life force, using your own statistics; roleplay weapon and wielder separately. The body needs normal air, food, water and sleep, though you only rest for 2 hours.",
		"You can't normally use the wielder ancestry's base benefits (such as darkvision), but as a single action with the concentrate trait you can use all of them for 1 round (repeatable as an exploration activity).",
		"Choose an Intelligence, Wisdom or Charisma-based skill and a Lore skill. You gain Additional Lore for the Lore skill and become trained in the other skill, but the wielder uses and improves them. Symbiotic weapons rarely enter inanimate mode, as it leaves the wielder defenseless.",
		"Talk with your group before playing a weapon that suppresses a sapient creature's will."
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
			"You manifest an avatar in your space (or an adjacent space if you were already in a creature's space) or unmanifest your current avatar. The avatar appears wielding you or with you stowed, as you choose; if another creature was holding you, it no longer is. The avatar appears in your space, which could be dangerous (for instance, inside a monster that swallowed you in inanimate mode)."
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
	desc: p("You've enhanced the senses from your creation. You gain darkvision.", "A possessing weapon gains no benefit unless possessing a creature with low-light vision."),
	rules: [{ key: "Sense", selector: "darkvision" }],
});
feat("Defensive Discorporation", 1, {
	action: "reaction",
	prereq: ["projecting weapon heritage"],
	freq: { max: 1, per: "PT10M" },
	desc: p(
		"<strong>Trigger</strong> An enemy's Strike against you is a critical hit.",
		"You discorporate your avatar instead of taking the wound. You unmanifest your avatar, and the triggering attack deals only the damage a normal hit would (typically not doubled). Other critical hit effects still occur. As normal, with your avatar unmanifested you're flat-footed and can't act except to use activation feats, Seek, Recall Knowledge, and manifest your avatar."
	),
});
feat("Enhanced Storage", 1, {
	prereq: ["animated weapon heritage"],
	desc: p("You can store more items within you in the same way as your invested items, up to your light load limit (typically 5 plus your Strength modifier). Armor plating and melded invested items and ammunition count against this limit."),
});
feat("Hidden Mind", 1, {
	action: "free",
	traits: ["fortune"],
	prereq: ["possessing weapon or symbiotic weapon heritage"],
	freq: perDay,
	desc: p(
		"<strong>Trigger</strong> You fail a Will saving throw.",
		"You shunt the effect onto your possessed body or symbiotic wielder. Reroll the failed save and take the better result, with a +1 circumstance bonus to the reroll if you're a possessing weapon or +2 if you're a symbiotic weapon.",
		"As a symbiotic weapon, if the second roll is a success, your wielder diffuses the effect for you and you can't use the skills granted by your wielder's heritage for 10 minutes."
	),
});
feat("Intelligent Weapon Lore", 1, {
	desc: p(
		"You become trained in Crafting and in the skill associated with your weapon magical tradition (Arcana for arcane, Religion for divine, Occultism for occult, Nature for primal). If you would automatically become trained in one of them, you instead become trained in a skill of your choice. You gain the Additional Lore feat for Intelligent Weapon Lore."
	),
});
feat("Reject the Unworthy", 1, {
	action: 1,
	traits: ["activation"],
	freq: { max: 1, per: "round" },
	desc: p(
		"Even in inanimate mode, you can punish those who dare wield you. The creature wielding you in inanimate mode (or wielding you if you're an item) takes 1d6 force damage per level you have, with a basic Will save. You can choose to force them to drop you."
	),
});
feat("Self Proficiency", 1, {
	desc: p(
		"You wield yourself with innate skill. If you're a martial weapon, you count as a simple weapon for determining your proficiency; if you're an advanced weapon, you count as a martial weapon. This doesn't affect other weapons of your kind. At 5th level, whenever you critically hit with yourself, you gain its critical specialization effect."
	),
});
feat("Shining Weapon", 1, {
	action: 1,
	traits: ["activation", "concentrate"],
	desc: p(
		"You can constantly glow with the effects of the <em>light</em> spell, in a color of your choice. As a single action with the concentrate trait you can stop or restart the glow."
	),
});
feat("Spellblade", 1, {
	traits: ["activation"],
	desc: p(
		"Choose a cantrip from your weapon magical tradition. You can use it at will as a Cast a Spell activation using your spell DC. You become trained in spell attack rolls and spell DCs for your weapon magical tradition if you weren't already, and your spellcasting ability is your choice of Intelligence, Wisdom or Charisma."
	),
});

// Level 5
feat("Fling Self", 5, {
	action: 1,
	traits: ["move"],
	prereq: ["animated weapon heritage"],
	freq: perHour,
	desc: p("You fling yourself 30 feet in a straight line in any direction, even straight up. You can land into a normal hover immediately or fall after using your next action; you choose when."),
});
feat("Guiding Strike", 5, {
	action: 1,
	traits: ["concentrate", "divination", "fortune", "magical"],
	freq: perDay,
	desc: p("You analyze every possibility before attacking. The next time you make an attack roll before the end of your turn, roll twice and use the better result. The attack ignores circumstance penalties to the attack roll and any flat check required because the target is concealed or hidden."),
});
feat("Disguise Quality", 5, {
	action: 2,
	traits: ["activation", "illusion", "magical", "visual"],
	desc: p("You disguise your quality and appearance: appearing decrepit and shoddy, brand new and polished, or another similar disguise the GM allows. The illusion lasts until you end or change it. A creature that Interacts with you can try to disbelieve it (DC equal to the higher of your class DC or spell DC)."),
});
feat("Precious Synthesis", 5, {
	prereq: ["you're a weapon made partially or entirely of metal and not a projectile weapon"],
	desc: p("Choose cold iron or silver. You are treated as that precious metal for the effects of weaknesses, resistances and the like."),
});
feat("Reforge Self", 5, {
	desc: p("Each day during your daily preparations you can reshape yourself into a different kind of level 0 or 1 weapon to which you have access. Runes, feats or abilities that no longer suit your new weapon type lose their effects. If your GM lets you gain the benefits of a specific weapon, you can't use this feat to change to a different kind."),
});
feat("Wielder Synergy", 5, {
	prereq: ["possessing weapon, projecting weapon, or symbiotic weapon heritage"],
	desc: p("You gain the Adopted Ancestry general feat for your wielder's ancestry and one 1st-level ancestry feat from that ancestry."),
});

// Level 9
feat("Distant Projection", 9, {
	prereq: ["projecting weapon heritage"],
	desc: p("When you manifest your avatar, it can appear anywhere within 30 feet you can see with a clear line of effect, and you're then pulled in a straight line into its hands. This movement has the move trait; if it's disrupted, your avatar winks out and you fall where the movement was disrupted."),
});
feat("Elusive Mind", 9, {
	prereq: ["Hidden Mind"],
	desc: p("You can use Hidden Mind once per hour instead of once per day."),
});
feat("Flying Weapon", 9, {
	action: 2,
	prereq: ["animated weapon heritage"],
	freq: perHour,
	desc: p("You gain a fly Speed equal to your Speed for 1 minute."),
});
feat("Hindering Weapon", 9, {
	prereq: ["you are a melee weapon"],
	desc: p("You gain your choice of the disarm, shove or trip weapon traits."),
});
feat("Instinctive Strikes", 9, {
	action: 2,
	traits: ["activation"],
	freq: perHour,
	desc: p("Make a Strike with yourself. For 1 minute you're quickened and can use the extra action to make a Strike with yourself. In inanimate mode or as an item, you don't Strike and your wielder gains quickened instead."),
});
feat("Merciful Weapon", 9, {
	desc: p("You gain the nonlethal trait, which you can keep or suppress each time you Strike or another creature Strikes with you."),
});
feat("Second Synthesis", 9, {
	prereq: ["Precious Synthesis"],
	desc: p("You are treated as both cold iron and silver for the effects of weaknesses, resistances and the like."),
});
feat("Self Repair", 9, {
	desc: p("You can repair yourself like an item while at rest. You can use Crafting instead of Medicine to Treat Wounds on yourself. If you rest for 10 minutes, you automatically regain Hit Points equal to your Constitution modifier &times; half your level, cumulative with Treat Wounds. You still can't regain Hit Points from the Repair action."),
});
feat("Spellblade Adept", 9, {
	traits: ["activation"],
	prereq: ["Spellblade"],
	desc: p("Select one 1st-level and one 2nd-level spell of your weapon magical tradition to which you have access. You can use each once per day as a Cast a Spell activation using your spell DC."),
});
feat("Warding Strikes", 9, {
	action: 2,
	traits: ["abjuration", "magical"],
	freq: perDay,
	desc: p(
		"Make a melee Strike with yourself against a foe. In addition to the Strike's normal effects, for up to 1 minute (ending early if the foe dies or at the end of any turn in which you didn't hit that foe with a melee Strike):",
		"<strong>Critical Success</strong> +3 status bonus to AC against the foe for 1 round, then +2 until the effect ends.",
		"<strong>Success</strong> +2 status bonus to AC against the foe until the effect ends.",
		"<strong>Failure</strong> +1 status bonus to AC against the foe until the effect ends.",
		"<strong>Critical Failure</strong> No additional effect."
	),
});

// Level 13
feat("Adamantine Synthesis", 13, {
	prereq: ["you're a non-projectile weapon made of metal"],
	desc: p("You are treated as adamantine for the effects of weaknesses, resistances and the like."),
});
feat("Dilating Projection", 13, {
	prereq: ["projecting weapon heritage"],
	desc: p("When you manifest your avatar, you can project it at its normal size, as a Large avatar (as <em>enlarge</em>) or a Tiny avatar (as <em>shrink</em>). This lasts until you manifest an avatar of a different size."),
});
feat("Insidious Weapon", 13, {
	prereq: ["possessing or symbiotic weapon heritage"],
	desc: p("Detection and revelation effects reveal results appropriate to your wielder rather than the true information about you, unless the effect's counteract level is higher than your own. A possessing weapon's wielder is a vacant body, so this may still yield suspicious results."),
});
feat("Quick Reforge", 13, {
	traits: ["concentrate", "manipulate"],
	prereq: ["Reforge Self"],
	desc: p("In addition to reforging during daily preparations, you can reforge yourself as a 10-minute activity."),
});
feat("Soaring Weapon", 13, {
	prereq: ["Flying Weapon"],
	desc: p("You permanently gain a fly Speed equal to your Speed. When you use Flying Weapon, you instead gain a +20-foot status bonus to your fly Speed for 1 minute."),
});
feat("Spellblade Master", 13, {
	traits: ["activation"],
	prereq: ["Spellblade Adept"],
	desc: p("Select one 3rd-level and one 4th-level spell of your weapon magical tradition to which you have access. You can use each once per day as a Cast a Spell activation using your spell DC."),
});
feat("Storm of Duplicates", 13, {
	action: 2,
	traits: ["activation", "evocation", "magical"],
	freq: perHour,
	desc: p("Choose a 30-foot cone, 10-foot emanation or 60-foot line. Creatures in the area take damage equal to your weapon damage dice plus one additional weapon damage die, with no other bonuses, penalties or modifiers, with a basic Reflex save against the higher of your class DC and spell DC. A creature that critically fails also takes your critical specialization effect and extra deadly or fatal damage as if you had critically hit."),
});

// Level 17
feat("Animated Hardness", 17, {
	prereq: ["animated weapon heritage"],
	desc: p("You gain 5 Hardness, but lose it after taking a critical hit or when your Hit Points fall below half your maximum. You regain it once you recover to your maximum Hit Points."),
});
feat("Orichalcum Synthesis", 17, {
	prereq: ["you're a weapon made partially or entirely of metal and not a projectile weapon"],
	desc: p("You are treated as orichalcum for the effects of weaknesses, resistances and the like."),
});
feat("Perfect Attunement", 17, {
	action: 2,
	traits: ["activation", "divination", "magical"],
	freq: perDay,
	desc: p("You gain a +3 status bonus to attack and damage rolls with yourself for 1 minute, then Strike with yourself. In inanimate form or as an item you can't Strike, and you grant the bonus to your wielder instead."),
});
feat("Spellblade Supremacy", 17, {
	traits: ["activation"],
	prereq: ["Spellblade Master"],
	desc: p("Select one 5th-level and one 6th-level spell of your weapon magical tradition to which you have access. You can use each once per day as a Cast a Spell activation using your spell DC."),
});
feat("Wall of Duplicates", 17, {
	action: 3,
	traits: ["activation", "evocation", "magical"],
	freq: perHour,
	desc: p("You create a wall 20 feet high, 120 feet long and 2 inches thick anywhere within 120 feet. It provides cover and deals damage equal to your weapon damage dice plus two additional weapon damage dice (no other modifiers) to each creature in its space when created, that tries to pass through, or that ends its turn inside, with a basic Reflex save. A creature that succeeds when the wall is created is pushed to the nearest space of its choice. A creature that critically fails can't pass through, ends its movement adjacent, and takes your critical specialization effect and extra deadly or fatal damage as if you had critically hit."),
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
