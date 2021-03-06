// Global varibale
let postList;
let configFile;

// Elements
let blogTitle = document.getElementById("title");
let blogSubtitle = document.getElementById("subtitle");
let blogHeader = document.getElementById("header");
let divContent = document.getElementById("content");
let postView = document.getElementById("postView");

// Regular expressions
let stripAllRegex = /^\s+|^[#]{1,}|^[-_*]{3,}|^[-+*]|[\*_]{1,2}(.+?)[\*_]{1,2}|~{2}(.+?)~{2}|^`{3}.*|`(.*?)`|!*\[(.*?)\]\(.*?\)/gm;
let inlineCodeRegex = /`(.+?)`/g;
let linkRegex = /\[(.+?)\]\((.+?)\)/g;
let boldRegex = /[*_]{2}(.+?)[*_]{2}/g;
let italicRegex = /[*_](.+?)[*_]/g;
let boldItalicRegex = /[*_]{3}(.+?)[*_]{3}/g;
let hrRegex = /^[-_*]{3,}$/g;
let imageRegex = /^!\[(.+?)\]\((.+?)\)/g;
let indentedCodeRegex = /^ {4}/g;
let backTickCodeRegex = /^`{3}/g;
let backTickCodeLanguageRegex = /^`{3} ?[\w\d]+/g;
let ulRegex = /^ ?[*\-+]{1} /g
let olRegex = /^ ?(\d+)\. /g;
let headingRegex = /^#+\s/g;

// Adds a random id to the end of a URL, to prevent caching
function appendRandomId(baseUrl) {
    let randomId = Math.random().toString().split(".")[1];
    return baseUrl + "?" + randomId;
}

// Strips all white space, #, -, *, _, +, ---, ___ and *** from the start and `, links, *, _, **, __ and ~~ throughout
function stripAll(string) {
    // Trim white space
    string = string.trim();

    string = string.replace(stripAllRegex, "$1$2$3$4");

    // Return string
    return string;
}

function getFile(url, callback) {
    // Prepare request
    let r = new XMLHttpRequest();

    // Prepare callbacks
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this.responseText);
        }
    }

    // Adds a random number to prevent caching
    url = appendRandomId(url);

    // Send the request
    r.open("GET", url, true);
    r.send();
}

// Gets the md file for a particular post
function getPost(post, postId, callback) {
    // Get the post md
    getFile("posts/" + post.link, function(response) {
        // Save the md and pass everything to the callback
        postList[postId].md = response;
        callback(postId);
    });
}

// Function to create a DOM element in one line
function makeElement(type, id, classList, innerHTML) {
    // Create the element
    let element = document.createElement(type);
    // Any IDs that it has
    if (id) {
        element.id = id;
    }
    // Any classes that it has
    if (classList) {
        for (i in classList) {
            element.classList.add(classList[i]);
        }
    }
    // Add any innerHTML
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}

// Adds a wrapper around any inline code
function checkForInlineCode(line) {
    // Check if there is any inline code
    while (inlineCode = inlineCodeRegex.exec(line)) {
        line = line.replace(inlineCodeRegex, "<code class=\"prettyprint\">$1</code>");
    }
    return line;
}

// Checks for any links in the line
function checkForLinks(line) {
    while (link = linkRegex.exec(line)) {
        line = line.replace(linkRegex, "<a href=\"$2\">$1</a>");
    }
    return line;
}

// Checks for bold text
function checkForBold(line) {
    while (boldRegex.exec(line)) {
        line = line.replace(boldRegex, "<b>$1</b>");
    }
    return line;
}

// Checks for italic text
function checkForItalic(line) {
    while (italicRegex.exec(line)) {
        line = line.replace(italicRegex, "<i>$1</i>");
    }
    return line;
}

// Checks for bold and italic text
function checkForBoldItalic(line) {
    while (boldItalicRegex.exec(line)) {
        line = line.replace(boldItalicRegex, "<i><b>$1</b></i>");
    }
    return line;
}

// Checks for inline things
function checkForInline(line) {
    line = checkForLinks(line);
    line = checkForInlineCode(line);
    line = checkForBold(line);
    line = checkForItalic(line);
    line = checkForBoldItalic(line);
    return line;
}


// Makes a li element
function makeLi(line, replaceRegex) {
    // Delete the symbol at the start
    line = line.replace(replaceRegex, "");
    line = checkForInline(line);
    let newLi = makeElement("li", undefined, undefined, line)
    return newLi;
}

// Turn markdown into html elements
function parseMarkdown(md) {
    // Final elements
    let finalElements = makeElement("div");

    // Split the file into lines
    md = md.split("\n");

    // Used for terminating paragraph tags. Anything other than another blank line will break it
    let isParagraph = false;
    // Used for grouping lists together. Either none, ul or ol.
    let listType = "none";
    // For code blocks
    let isCodeBlock = false;
    let isIndentedCodeBlock = false;
    let firstCodeLine = false;

    for (i in md) {
        // Line by line work out elements
        let line = md[i];

        // Reset the regexs each time
        stripAllRegex.lastIndex = 0;
        inlineCodeRegex.lastIndex = 0;
        linkRegex.lastIndex = 0;
        boldRegex.lastIndex = 0;
        italicRegex.lastIndex = 0;
        boldItalicRegex.lastIndex = 0;
        hrRegex.lastIndex = 0;
        imageRegex.lastIndex = 0;
        indentedCodeRegex.lastIndex = 0;
        backTickCodeRegex.lastIndex = 0;
        backTickCodeLanguageRegex.lastIndex = 0;
        ulRegex.lastIndex = 0;
        olRegex.lastIndex = 0;
        headingRegex.lastIndex = 0;

        // <hr/>
        if (hrRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            listType = "none";
            isIndentedCodeBlock = false;
            finalElements.appendChild(makeElement("hr"));
        }

        // Images
        else if (imageRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            listType = "none";
            isIndentedCodeBlock = false;

            // This line must be used after .test() if the regex will be used again
            imageRegex.lastIndex = 0;
            let imageData = imageRegex.exec(line);

            let newImage = makeElement("img");
            newImage.alt = imageData[1];
            newImage.src = imageData[2];
            newImage.style.width = "100%";

            finalElements.appendChild(newImage);
        }

        // Code blocks with spaces
        else if (indentedCodeRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            listType = "none";
            // Replace the spaces at the start of the line with a new line
            line = line.replace(indentedCodeRegex, "\n");

            // If it's not already in a code block, make a new one
            if (!isIndentedCodeBlock) {
                // Make a new code block and append it
                let newCodeBlock = makeElement("pre", undefined, ["prettyprint", "linenums"]);
                finalElements.appendChild(newCodeBlock);

                // Removes the extra new line at the start
                line = line.replace("\n", "");

                isIndentedCodeBlock = true;
            }

            // Add the line to the code block
            finalElements.lastChild.innerHTML += line;
        }

        // Code blocks with backticks (and optional language)
        else if (backTickCodeRegex.test(line)) {
                isParagraph = false;
                listType = "none";
                isIndentedCodeBlock = false;

                // Opening code block
                if (!isCodeBlock) {
                    // Check if a language is supplied
                    let language;
                    if (backTickCodeLanguageRegex.test(line)) {
                        // Extract the language
                        backTickCodeLanguageRegex.lastIndex = 0;
                        language = backTickCodeLanguageRegex.exec(line)[1];
                    }

                    let classList;
                    if (language == "nocode") {
                        classList = ["prettyprint", "linenums", "nocode"];
                    } else if (language) {
                        classList = ["prettyprint", "linenums", "lang-" + language];
                    } else {
                        classList = ["prettyPrint", "linenums"];
                    }
                    // Make the element
                    let newCodeBlock = makeElement("pre", undefined, classList);
                    finalElements.appendChild(newCodeBlock);

                    firstCodeLine = true;
                    isCodeBlock = true;
                }
                // Closing code block
                else {
                    isCodeBlock = false;
                }
        }

        // ul
        else if (ulRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            isIndentedCodeBlock = false;
            // Delete the symbol at the start
            line = line.replace(ulRegex, "");

            // If not already an ul
            if (listType != "ul") {
                // Make a new ul
                let newUl = makeElement("ul");
                finalElements.appendChild(newUl);

                listType = "ul";
            }

            // Make and append a li
            finalElements.lastChild.appendChild(makeLi(line));
        }

        // ol
        else if (olRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            isIndentedCodeBlock = false;

            // Get the starting number for the list
            olRegex.lastIndex = 0;
            let startNumber = olRegex.exec(line)[1];

            // Delete the symbol at the start
            line = line.replace(olRegex, "");

            // If not already an ol
            if (listType != "ol") {
                // Make a new ol
                let newOl = makeElement("ol");
                finalElements.appendChild(newOl);

                listType = "ol";
            }

            // Make and append a li
            let newLi = makeLi(line);
            newLi.value = startNumber;
            finalElements.lastChild.appendChild(newLi);
        }

        // Ends the paragraph totally
        else if (line == "" && isParagraph && !isCodeBlock) {
            isParagraph = false;
        }

        // Headings
        else if (headingRegex.test(line) && !isCodeBlock) {
            isParagraph = false;
            isIndentedCodeBlock = false;
            listType = "none";
            // Determine the heading size
            let headingSize = line.split(" ")[0].length;
            headingSize > 6 ? headingSize = "h6": headingSize = "h" + headingSize;

            // Get rid of the symbols at the start
            line = line.replace(headingRegex, "");

            // Make the heading
            let heading = makeElement(headingSize, undefined, undefined, line);

            // Append it
            finalElements.appendChild(heading);
        }

        // Escaped line (with backslash)
        else if (line[0] == "\\") {
            line = line.replace(/^\\/g, "");

            listType = "none";
            isCodeBlock = false;
            isIndentedCodeBlock = false;

            line = checkForInline(line);

            if (isParagraph) {
                // Continuing on from another paragraph. Only add a line break
                finalElements.lastChild.innerHTML += "<br/>" + line;
            } else {
                // New paragraph totally
                isParagraph = true;
                let paragraph = makeElement("p", undefined, undefined, line);
                finalElements.appendChild(paragraph);
            }
        }

        // Paragraph or code block. Make sure that it isn't a random new line
        else if (line != "") {
            // Code block
            if (isCodeBlock) {
                // Add a new line if it's not the first line
                line = !firstCodeLine ? "\n" + line : line;
                firstCodeLine = false;
                // Append the line to the code element
                finalElements.lastChild.innerHTML += line;
            }
            // Paragraph
            else {
                listType = "none";
                isCodeBlock = false;
                isIndentedCodeBlock = false;

                line = checkForInline(line);

                if (isParagraph) {
                    // Continuing on from another paragraph. Only add a line break
                    finalElements.lastChild.innerHTML += "<br/>" + line;
                } else {
                    // New paragraph totally
                    isParagraph = true;
                    let paragraph = makeElement("p", undefined, undefined, line);
                    finalElements.appendChild(paragraph);
                }
            }
        }
    }
    return finalElements;
}

// Opens a window with the full post
function displayFullPost(postId) {
    // Hide the post list and show the post container
    divContent.style.display = "none";
    postView.style.display = "block";

    // Get the current post details
    let currentPost = postList[postId];

    // Make elements
    let postHeader = makeElement("div", "postHeader");
    let postHeading = makeElement("h1", "postHeading", undefined, currentPost.title);
    let postDate = makeElement("p", "postDate", undefined, currentPost.date);
    let postHr = makeElement("hr");

    // Append the elements
    postView.appendChild(postHeader);
    postHeader.appendChild(postHeading);
    postHeader.appendChild(postDate);
    postHeader.appendChild(postHr);

    // Do the markdown
    let parsedMd = parseMarkdown(currentPost.md);
    parsedMd.id = "postContent";
    postView.appendChild(parsedMd);
    // Run prettify (if needed)
    PR.prettyPrint();
}

// Displays all the posts from the post list with a preview
function displayPostList() {
    // For each post
    for (postId=0; postId<postList.length; postId++) {
        let currentPost = postList[postId];

        // Get the md for the post
        getPost(currentPost, postId, function(postId) {
            // Make the preview
            // Outer div
            let postPreview = makeElement("div", undefined, ["postPreview"]);
            // Add a meta tag with the post id
            postPreview.postId = postId;

            // Heading
            let heading = makeElement("h2", undefined, ["heading"], currentPost.title);
            postPreview.appendChild(heading);

            // Date
            let date = makeElement("p", undefined, ["date"], currentPost.date);
            postPreview.appendChild(date);

            // hr
            let hr = makeElement("hr");
            postPreview.appendChild(hr);

            // Preview
            let preview = makeElement("div", undefined, ["preview"]);

            // Preview items (only 3)
            // Break apart the md file for parsing line by line
            let splitMdFile = currentPost.md.split("\n");
            // Used for getting the post
            let offset = 0;
            for (i=0; i < 3; i++) {
                // Make sure that there's enough lines to preview
                if (splitMdFile[offset]) {
                    // Line element
                    let previewLine = makeElement("p", undefined, undefined, stripAll(splitMdFile[offset]));

                    // If the line is blank (hr, code snippet etc)
                    if (previewLine.innerHTML == "") {
                        i--;
                        offset++;
                    }
                    offset++;

                    // Append line to the parent div
                    preview.appendChild(previewLine);
                }
            }

            // Append the preview
            postPreview.appendChild(preview);

            // Add the event listener
            postPreview.onclick = function() {
                displayFullPost(this.postId);
            }

            // Append the post preview to the content div
            divContent.appendChild(postPreview);
        });
    }
}

// Sends request for the post list
function loadPostList() {
    getFile("posts/postList.json", function(response) {
        postList = JSON.parse(response);
        displayPostList();
    });
}

// Close the post and go back to the post list
function closePost() {
    // Delete the children until one is left (the close button)
    while (postView.children.length != 1) {
        let lastElement = postView.lastElementChild
        postView.removeChild(lastElement);
    }

    // Hide the post view and go back to the list
    postView.style.display = "none";
    divContent.style.display = "block";
}

// Loads and enforces the config file
function loadConfig() {
    getFile("config.json", function(response) {
        configFile = JSON.parse(response);

        // Change the title and subtitle
        blogTitle.innerHTML = configFile.title;
        blogSubtitle.innerHTML = configFile.subtitle;

        // Make a style sheet for all the colors and fonts
        let stylesheet = makeElement("style");

        // Colors and fonts for header
        let headerColors = configFile.colors.header;
        stylesheet.innerHTML += "#header{background:" + headerColors.background + ";color:" + headerColors.text + ";font-family:" + configFile.fonts.header + "}";

        // Colors and fonts for post previews
        let postPreviewColors = configFile.colors.postPreview;
        stylesheet.innerHTML += ".postPreview{background:" + postPreviewColors.background + ";color:" + postPreviewColors.text + ";font-family:" + configFile.fonts.postPreview + "}";

        // Colors and fonts for the full post
        let postColors = configFile.colors.post;
        let postFonts = configFile.fonts.post;
        // Close button
        stylesheet.innerHTML += "#closePost{background:" + postColors.closeButton + "}";
        // Post heading
        stylesheet.innerHTML += "#postHeader>*{color:" + postColors.heading + ";font-family:" + postFonts.heading + "}";
        // hr
        stylesheet.innerHTML += "#postView hr{border-color:" + postColors.hr + "}";
        // h1
        stylesheet.innerHTML += "#postContent h1{color:" + postColors.h1 + ";font-family:" + postFonts.h1 + "}";
        // h2
        stylesheet.innerHTML += "#postContent h2{color:" + postColors.h2 + ";font-family:" + postFonts.h2 + "}";
        // h3
        stylesheet.innerHTML += "#postContent h3{color:" + postColors.h3 + ";font-family:" + postFonts.h3 + "}";
        // h4
        stylesheet.innerHTML += "#postContent h4{color:" + postColors.h4 + ";font-family:" + postFonts.h4 + "}";
        // h5
        stylesheet.innerHTML += "#postContent h5{color:" + postColors.h5 + ";font-family:" + postFonts.h5 + "}";
        // h6
        stylesheet.innerHTML += "#postContent h6{color:" + postColors.h6 + ";font-family:" + postFonts.h6 + "}";
        // p
        stylesheet.innerHTML += "#postContent p{color:" + postColors.p + ";font-family:" + postFonts.ppostContent + "}";


        // Add the stylesheet
        document.head.appendChild(stylesheet);
    });
}

document.getElementById("closePost").onclick = function() {
    closePost();
}

loadConfig();
loadPostList();
