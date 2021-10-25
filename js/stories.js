"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
	// console.debug("generateStoryMarkup", story);

	const hostName = story.getHostName();

	// if a user is logged in, use a Boolean expression to convert the user to a boolean
	const showStar = Boolean(currentUser);

	return $(`
      <li id="${story.storyId}">
	  	${showDeleteBtn ? getDeleteBtnHTML() : ""}
	  	${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getDeleteBtnHTML() {
	const html = `<span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
	return html;
}

function getStarHTML(story, user) {
	const isFavorite = user.isFavorite(story);
	const starType = isFavorite ? "fas" : "far";
	return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug("putStoriesOnPage");

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

// Handle submitting getting data from the form, calling addStory method
// And putting that new story on the page
async function submitNewStoryForm(evt) {
	evt.preventDefault();

	let formData = {
		author: $("#author-name").val(),
		title: $("#story-title").val(),
		url: $("#story-url").val(),
		username: currentUser.username,
	};

	const story = await storyList.addStory(currentUser, formData);
	const $story = generateStoryMarkup(story);
	$allStoriesList.prepend($story);

	$submitStoryForm.slideUp();
	$submitStoryForm.trigger("reset");
}

$submitStoryForm.on("submit", submitNewStoryForm);

function putFavoritesListOnPage() {
	$favoritedStories.empty();

	if (currentUser.favorites.length === 0) {
		$favoritedStories.append("<h5>You have no favorites</h5>");
	} else {
		for (let story of currentUser.favorites) {
			const $story = generateStoryMarkup(story);
			$favoritedStories.append($story);
		}
	}
	console.log("FROM PUT FAVORITE LIST ON PAGE");
	$favoritedStories.show();
}

async function toggleStoryFavorite(evt) {
	const $tgt = $(evt.target);
	const $closestLi = $tgt.closest("li");
	const storyId = $closestLi.attr("id");
	const story = storyList.stories.find(function (s) {
		return s.storyId === storyId;
	});

	if ($tgt.hasClass("fas")) {
		await currentUser.removeFavorite(story);
		$tgt.closest("i").toggleClass("fas far");
	} else {
		await currentUser.addFavorite(story);
		$tgt.closest("i").toggleClass("fas far");
	}
	console.log("FROM INSIDE TOGGLE");
}
$storiesLists.on("click", ".star", toggleStoryFavorite);

function putUserStoriesOnPage() {
	$ownStories.empty();

	if (currentUser.ownStories.length === 0) {
		$ownStories.append("<h5>No stories added by user yet!</h5>");
	} else {
		for (let story of currentUser.ownStories) {
			let $story = generateStoryMarkup(story, true);
			$ownStories.append($story);
		}
	}

	$ownStories.show();
}

async function deleteStory(evt) {
	const $closestLi = $(evt.target).closest("li");
	const storyId = $closestLi.attr("id");

	await storyList.removeStory(currentUser, storyId);

	// re-generate story list
	await putUserStoriesOnPage();
}
$ownStories.on("click", ".trash-can", deleteStory);
