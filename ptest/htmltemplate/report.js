$(window).load(function () {
    $(function () {
        $('.tree li.leaf > a').on('click', function (e) {
            renderDetailPanel($(this).parent().data("data"));
            e.stopPropagation();
        });

        $('.tree li.parent .sign').on('click', function (e) {
            var children = $(this).parent().parent().find(' > ul > li');
            if (children.is(":visible")) {
                children.hide('fast');
                $(this).attr('title', 'Click to expand.');
                $(this).find(' > i').addClass('icon-plus').removeClass('icon-minus');
            } else {
                children.show('fast');
                $(this).attr('title', 'Click to collapsed.')
                $(this).find(' > i').addClass('icon-minus').removeClass('icon-plus');
            }
            e.stopPropagation();
        });
    });
});

String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if (args[key] != undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    var reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

renderTree = function (testSuite) {
    appendToNode = function (parentNode, data, visible) {
        var node = null;
        if (data.type == "testfixture" || data.type == "testcase") {
            // an empty test fixture
            if (data.type == "testfixture" && data.isEmpty) {
                return node;
            }
            var nodeContent = '<li class="node leaf"><a title={fullName}><span class="name">{name}</span></a></li>';
            if (data.hasOwnProperty("fixtureType")) {
                // test fixture
                node = $(nodeContent.format({
                    "name": '@' + data.fixtureType,
                    "fullName": data.fullName
                }));
            } else {
                // test case
                node = $(nodeContent.format({
                    "name": data.name,
                    "fullName": data.fullName
                }));
            }
        }
        else {
            // test container
            var nodeContent = '<li class="node parent"><a title={fullName}><span class="sign"><i class="icon-minus"></i></span><span class="name">{name}</span></a><ul></ul></li>';
            node = $(nodeContent.format({
                "name": data.name,
                "fullName": data.fullName,
                "total": data.statusCount.total,
                "passed": data.statusCount.passed,
                "failed": data.statusCount.failed,
                "skipped": data.statusCount.skipped
            }));
        }
        if (!visible) {
            node.css('display', 'none');
        }
        node.data("data", data);
        parentNode.find(' > ul').append(node);
        return node;
    };

    var testSuiteNode = appendToNode($('.navigation .tree'), testSuite, true);

    appendToNode(testSuiteNode, testSuite.beforeSuite, true);

    for (var i = 0; i < testSuite.testClasses.length; i++) {
        var testClass = testSuite.testClasses[i];
        var testClassNode = appendToNode(testSuiteNode, testClass, true);

        appendToNode(testClassNode, testClass.beforeClass, false);

        for (var j = 0; j < testClass.testGroups.length; j++) {
            var testGroup = testClass.testGroups[j];
            var testGroupNode = appendToNode(testClassNode, testGroup, false);

            appendToNode(testGroupNode, testGroup.beforeGroup, false);

            for (var k = 0; k < testGroup.testCases.length; k++) {
                var testCase = testGroup.testCases[k];
                appendToNode(testGroupNode, testCase, false);
            }

            appendToNode(testGroupNode, testGroup.afterGroup, false);
        }

        appendToNode(testClassNode, testClass.afterClass, false);
    }

    appendToNode(testSuiteNode, testSuite.afterSuite, true);
};

renderTestFixturePanel = function (detailPanel, data) {
    var testFixturePanel = $('<div class="test-fixture panel"><div class="panel-heading"></div><div class="panel-body"><table></table></div></div>');
    var panelHeader = testFixturePanel.find('.panel-heading');
    panelHeader.addClass(data.status);
    panelHeader.text('@' + data.fixtureType);

    var fieldTable = testFixturePanel.find('table');
    var fullName = $('<tr><td>Full Name</td><td>{0}</td></tr>'.format(data.fullName));
    fieldTable.append(fullName);
    var name = $('<tr><td>Method Name</td><td>{0}</td></tr>'.format(data.name));
    fieldTable.append(name);
    var startTime = $('<tr><td>Start Time</td><td>{0}</td></tr>'.format(data.startTime));
    fieldTable.append(startTime);
    var endTime = $('<tr><td>End Time</td><td>{0}</td></tr>'.format(data.endTime));
    fieldTable.append(endTime);
    var duration = $('<tr><td>Duration</td><td>{0}s</td></tr>'.format(data.elapsedTime));
    fieldTable.append(duration);
    var description = $('<tr><td>Description</td><td>{0}</td></tr>'.format(data.description));
    fieldTable.append(description);
    var logs = $('<tr><td>Logs</td><td class="logs"></td></tr>');
    fieldTable.append(logs);
    var logGroup = logs.find('.logs');
    for (var i = 0; i < data.logs.length; i++) {
        var level = data.logs[i].level;
        var message = data.logs[i].message;
        var log = $('<span class="log-level">[{0}] </span><span class="{0}">{1}</span><br/>'.format(level, message));
        logGroup.append(log);
    }
    if (data.screenshot != null) {
        var screenshot = $('<tr><td>Screenshot</td><td><a class="screenshot-link" href="{0}" data-lightbox="{0}"><img class="screenshot" src="{0}" /></a></td></tr>'.format(data.screenshot));
        fieldTable.append(screenshot);
    }

    detailPanel.append(testFixturePanel);
};

renderDetailPanel = function (data) {
    var detailPanel = $('.detail');
    var detailPanelHeader = detailPanel.find('.panel-heading .text');
    var detailPanelBody = detailPanel.find('.panel-body');
    detailPanelHeader.text(data.fullName);
    detailPanelBody.empty();
    switch (data.type) {
        case "testfixture":
            renderTestFixturePanel(detailPanelBody, data);
            break;
        case "testcase":
            var fieldTable = $('<table class="testcase"></table>');

            var tags = $('<tr><td>Tags</td><td></td></tr>');
            var tagSlot = tags.find('td:nth-child(2)');
            for (var i=0; i < data.tags.length; i++) {
                tagSlot.append($('<span class="tag">{0}</span>'.format(data.tags[i])));
            }
            fieldTable.append(tags);

            var group = $('<tr><td>Group</td><td></td></tr>');
            group.find('td:nth-child(2)').append($('<span class="group">{0}</span>'.format(data.group)));
            fieldTable.append(group);

            var startTime = $('<tr><td>Start Time</td><td>{0}</td></tr>'.format(data.startTime));
            fieldTable.append(startTime);
            var endTime = $('<tr><td>End Time</td><td>{0}</td></tr>'.format(data.endTime));
            fieldTable.append(endTime);
            var duration = $('<tr><td>Duration</td><td>{0}s</td></tr>'.format(data.elapsedTime));
            fieldTable.append(duration);
            var description = $('<tr><td>Description</td><td>{0}</td></tr>'.format(data.description));
            fieldTable.append(description);

            detailPanelBody.append(fieldTable);
            if (!data.beforeMethod.isEmpty) {
                renderTestFixturePanel(detailPanelBody, data.beforeMethod);
            }
            renderTestFixturePanel(detailPanelBody, data.test);
            if (!data.afterMethod.isEmpty) {
                renderTestFixturePanel(detailPanelBody, data.afterMethod);
            }
            break;
        case "testsuite":
            break;
        case "testclass":
            break;
        case "testgroup":
            break;
    }
};