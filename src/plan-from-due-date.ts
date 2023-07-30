/*{
	"type": "action",
	"targets": ["omnifocus"],
	"author": "Mohd Faiz Hasim",
	"identifier": "com.faizhasim.omnifocus.PlanFromDueDate",
	"version": "1.0",
	"description": "Plug-In Description",
	"label": "Plan from Due Date",
	"shortLabel": "Plan from Due Date",
	"paletteLabel": "Plan from Due Date",
	"image": "powerplug.fill"
}*/
(() => {
	enum Days {
		Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
	}

	const now = new Date();

	const todayDate = (() => {
		const nextDate = new Date(now);
		nextDate.setDate(nextDate.getDate() + 1);
		nextDate.setHours(0,0,0,0);
		return nextDate;
	})();

	const thisWeekDate = (() => {
		const nextDate = new Date(now);
		nextDate.setDate(nextDate.getDate() - now.getDay());

		const weekModifier = (() => {
			switch (now.getDay()) {
				case Days.Monday:
				case Days.Tuesday:
				case Days.Wednesday:
				case Days.Thursday:
					return 1;
				case Days.Friday:
				case Days.Saturday:
					return 2;
				case Days.Sunday:
					return 1;
				default:
					return 1;
			}
		})();

		nextDate.setDate(nextDate.getDate() + (7 * weekModifier));
		nextDate.setHours(0,0,0,0);
		return nextDate;
	})();

	const thisMonthDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

	const planningTagNames = ["Today", "This Week", "This Month", "This Quarter"] as const;
	type PlanningTagName = typeof planningTagNames[number];

	const planningTags = Object.fromEntries(planningTagNames.map(name => ([name, tags.byName("Planning").tagNamed(name)] as const)));

	const addTagCleanly = (task: Task, planningTagName: PlanningTagName) => {
		const newPlanningTag = planningTags[planningTagName];
		for (const [tagName, tag] of Object.entries(planningTags)) {
			if (tagName !== newPlanningTag.name) {
				task.removeTag(tag);
			}
		}
		task.addTag(newPlanningTag);
	}

	const setTagFromDueDate = (task: Task) => {
		if (task.effectiveDueDate?.getTime() < todayDate.getTime()) {
			addTagCleanly(task, "Today");
		} else if (task.effectiveDueDate?.getTime() < thisWeekDate.getTime()) {
			addTagCleanly(task, "This Week");
		} else if (task.effectiveDueDate?.getTime() < thisMonthDate.getTime()) {
			addTagCleanly(task, "This Month");
		}
	}

	const action = new PlugIn.Action( async (selection,  sender) => {
		try {
			selection.tasks.forEach((task: Task) => {
				setTagFromDueDate(task);
			})
		} catch (err: unknown) {
			const omniError = err as OmniError;

			if(!omniError.causedByUserCancelling){
				console.error(omniError.name, omniError.message);
				await new Alert(omniError.name, omniError.message).show();
			}
		}
	});

	action.validate = (selection,  sender) => {
		return (selection.tasks.length > 0)
	};

	return action;
})();
