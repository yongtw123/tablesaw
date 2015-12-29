/*
* tablesaw: A set of plugins for responsive tables
* Sortable column headers
* Copyright (c) 2013 Filament Group, Inc.
* MIT License
*/

; (function ($) {
	function getSortValue(cell) {
		return $.map(cell.childNodes, function (el) {
			var $el = $(el);
			if ($el.is('input, select')) {
				return $el.val();
			} else if ($el.hasClass('tablesaw-cell-label')) {
				return;
			}
			return $.trim($el.text());
		}).join('');
	}

	var pluginName = "tablesaw-sortable",
		initSelector = "table[data-" + pluginName + "]",
		sortableSwitchSelector = "[data-" + pluginName + "-switch]",
		sortableMemoizeSelector = "[data-" + pluginName + "-memoize]",
		cookieName = pluginName + '-sortby',
		attrs = {
			defaultCol: "data-" + pluginName + "-default-col",
			numericCol: "data-" + pluginName + "-numeric",
			forceAsc: "data-" + pluginName + "-force-asc",
			forceDesc: "data-" + pluginName + "-force-desc"
		},
		classes = {
			head: pluginName + "-head",
			ascend: pluginName + "-ascending",
			descend: pluginName + "-descending",
			switcher: pluginName + "-switch",
			tableToolbar: 'tablesaw-toolbar',
			sortButton: pluginName + "-btn"
		},
		methods = {
			_create: function (o) {
				return $(this).each(function () {
					var init = $(this).data("init" + pluginName);
					if (init) {
						return false;
					}
					$(this)
						.data("init" + pluginName, true)
						.trigger("beforecreate." + pluginName)[pluginName]("_init", o)
						.trigger("create." + pluginName);
				});
			},
			_init: function () {
				var el = $(this),
					heads,
					$switcher;

				var addClassToTable = function () {
						el.addClass(pluginName);
					},
					addClassToHeads = function (h) {
						$.each(h, function (i, v) {
							$(v).addClass(classes.head);
						});
					},
					makeHeadsActionable = function (h, fn) {
						$.each(h, function (i, v) {
							var b = $("<button class='" + classes.sortButton + "'/>");
							b.bind("click", { col: v }, fn);
							$(v).wrapInner(b);
						});
					},
					clearOthers = function (sibs) {
						$.each(sibs, function (i, v) {
							var col = $(v);
							col.removeAttr(attrs.defaultCol);
							col.removeClass(classes.ascend);
							col.removeClass(classes.descend);
						});
					},
					headsOnAction = function (e) { //callback function for th button
						e.preventDefault();
						e.stopPropagation();
						if ($(e.target).is('a[href]')) { return; }

						var head = $(this).parent(),
							//v = e.data.col,
							newSortValue = heads.index(head);

						if (head.hasClass(classes.descend)) {
							if (!head.is('[' + attrs.forceDesc + ']')) { newSortValue += '_asc'; }
							else { return; /* no-op */ }
						}
						else if (head.hasClass(classes.ascend)) {
							if (!head.is('[' + attrs.forceAsc + ']')) { newSortValue += '_desc'; }
							else { return; /* no-op */ }
						}
						else {
							if (head.is('[' + attrs.forceAsc + ']')) { newSortValue += '_asc'; }
							else { newSortValue += '_desc'; }
						}
						
						callSortWithSortval(newSortValue);						
					},
					handleDefault = function (heads) {
						// TODO What if no default column is specified?
						var defaultCol = $(heads).filter('[' + attrs.defaultCol + ']');
						if (defaultCol.is('[' + attrs.forceDesc + ']')) {
							defaultCol.addClass(classes.descend);
						}
						else if (defaultCol.is('[' + attrs.forceAsc + ']') || !defaultCol.hasClass(classes.descend)) {
							defaultCol.addClass(classes.ascend);
						}
					},
					addSwitcher = function (heads) {
						$switcher = $('<div>').addClass(classes.switcher).addClass(classes.tableToolbar).html(function () {
							var html = ['<label><span class="tablesaw-sort-label">' + Tablesaw.i18n.sort + '</span>:'];

							html.push('<span class="btn btn-small">&#160;<select>');
							heads.each(function (j) {
								var $t = $(this);
								var isDefaultCol = $t.is("[" + attrs.defaultCol + "]");
								var isDescending = $t.hasClass(classes.descend);

								var isNumeric;
								if ($t.is('[' + attrs.numericCol + ']')) {
									isNumeric = true;
								}
								else {
									var numericCount = 0;
									// Check only the first four rows to see if the column is numbers.
									var numericCountMax = 5;

									$(this.cells).slice(0, numericCountMax).each(function () {
										if (!isNaN(parseInt(getSortValue(this), 10))) {
											numericCount++;
										}
									});
									isNumeric = numericCount === numericCountMax;
									$t.attr("data-sortable-numeric", isNumeric ? "" : "false");
								}

								if (!$t.is('[' + attrs.forceDesc + ']')) { //add asc option if desc NOT forced
									html.push('<option' + (isDefaultCol && !isDescending ? ' selected' : '') + ' value="' + j + '_asc">' + $t.text() + ' ' + (isNumeric ? '&#x2191;' : '(A-Z)') + '</option>');
								}
								if (!$t.is('[' + attrs.forceAsc + ']')) { //add desc option if asc NOT forced
									html.push('<option' + (isDefaultCol && isDescending ? ' selected' : '') + ' value="' + j + '_desc">' + $t.text() + ' ' + (isNumeric ? '&#x2193;' : '(Z-A)') + '</option>');
								}
							});
							html.push('</select></span></label>');

							return html.join('');
						});

						var $toolbar = el.prev().filter('.tablesaw-bar'),
							$firstChild = $toolbar.children().eq(0);

						if ($firstChild.length) { $switcher.insertBefore($firstChild); }
						else { $switcher.appendTo($toolbar); }
						
						$switcher.find('.btn').tablesawbtn();
						$switcher.find('select').on('change', function () {
							callSortWithSortval($(this).val());
						});
					},
					callSort = function(head, ascending, raw) {
						clearOthers(head.siblings());
						el[pluginName]('sortBy', head, ascending);
						if (el.is(sortableMemoizeSelector)) {
							el[pluginName]('memoizeSort', raw);
						}
						if ($switcher) {
							$switcher.find('select').val(raw).trigger('refresh');
						}
					},
					callSortWithSortval = function(sortval) {
						var tmp = sortval.split('_');
						callSort(heads.eq(tmp[0]), tmp[1] === 'asc', sortval);
					},
					sortImmediately = function(heads) {
						var defaultCol = $(heads).filter('[' + attrs.defaultCol + '="onLoad"]');
						if (defaultCol.length) {
							el[pluginName]('sortBy', defaultCol, defaultCol.hasClass(classes.ascend));
						}
					},
					resortHandler = function(e, sv) {
						//console.log(el);
						e.stopPropagation();
                        if (sv) { callSortWithSortval(sv); }
                        else { console.error('Tablesaw.sortable: no sortval, resort ignored'); }	
					};

				addClassToTable();
				heads = el.find("thead th[data-" + pluginName + "-col]");
				addClassToHeads(heads);
				makeHeadsActionable(heads, headsOnAction);
				handleDefault(heads);
                if (el.is(sortableSwitchSelector)) {
                    addSwitcher(heads, el.find('tbody tr:nth-child(-n+3)'));
                }
                
				/* check if has previous sort setting */
				if (el.is(sortableMemoizeSelector)) {
                    el.on('resort', resortHandler);
					if (el[pluginName]('resort')) { return; }
				}
				/* none OR no sortval detected, proceed normally */
				sortImmediately(heads);
			},
            resort: function() {
				/* Exposing closure method does not work here: each invocation is in different context.
				   Resort to event trigger 
				*/
				var el = $(this),
					sortval = el[pluginName]('retrieveSort');
				if (sortval) {
					$(this).trigger('resort', [sortval]);
					return true;
				} else {
					return false;
				}
            },
			memoizeSort: function(val) {
				var d = new Date();
				d.setTime(d.getTime() + 1*24*60*1000);
				document.cookie = cookieName+'='+val+';path=/;expires='+d.toUTCString();
			},
			retrieveSort: function() {
				var cookies = document.cookie.split(';');
				for (var i=0; i<cookies.length; i++) {
					var cookie = cookies[i].trim();
					if (cookie.indexOf(cookieName) === 0) { 
						return cookie.split('=')[1];
					}
				}
				return null;
			},
			getColumnNumber: function (col) {
				return $(col).prevAll().length;
			},
			getTableRows: function () {
				return $(this).find("tbody tr");
			},
			sortRows: function (rows, colNum, ascending, col) {
				var cells, fn, sorted;
				var getCells = function (rows) {
                        var cells = [];
                        $.each(rows, function (i, r) {
                            var element = $(r).children().get(colNum);
                            cells.push({
                                element: element,
                                cell: getSortValue(element),
                                rowNum: i
                            });
                        });
                        return cells;
                    },
					getSortFxn = function (ascending, forceNumeric) {
						var fn,
							regex = /[^\-\+\d\.]/g;
						if (ascending) {
							fn = function (a, b) {
								if (forceNumeric) {
									return parseFloat(a.cell.replace(regex, '')) - parseFloat(b.cell.replace(regex, ''));
								} else {
									return a.cell.toLowerCase() > b.cell.toLowerCase() ? 1 : -1;
								}
							};
						} else {
							fn = function (a, b) {
								if (forceNumeric) {
									return parseFloat(b.cell.replace(regex, '')) - parseFloat(a.cell.replace(regex, ''));
								} else {
									return a.cell.toLowerCase() < b.cell.toLowerCase() ? 1 : -1;
								}
							};
						}
						return fn;
					},
					applyToRows = function (sorted, rows) {
						var newRows = [], i, l, cur;
						for (i = 0, l = sorted.length; i < l; i++) {
							cur = sorted[i].rowNum;
							newRows.push(rows[cur]);
						}
						return newRows;
					};

				cells = getCells(rows);
				var customFn = $(col).data('tablesaw-sort');
				fn = (customFn && typeof customFn === "function" ? customFn(ascending) : false) ||
				getSortFxn(ascending, $(col).is('['+attrs.numericCol+']') && !$(col).is('['+attrs.numericCol+'="false"]'));
				sorted = cells.sort(fn);
				rows = applyToRows(sorted, rows);
				return rows;
			},
			replaceTableRows: function (rows) {
				var el = $(this),
					body = el.find("tbody");
				body.html(rows);
			},
			makeColDefault: function (col, a) {
				var c = $(col);
				c.attr(attrs.defaultCol, "true");
				if (a) {
					c.removeClass(classes.descend);
					c.addClass(classes.ascend);
				} else {
					c.removeClass(classes.ascend);
					c.addClass(classes.descend);
				}
			},
			sortBy: function (col, ascending) {
				var el = $(this), colNum, rows;

				colNum = el[pluginName]("getColumnNumber", col);
				rows = el[pluginName]("getTableRows");
				rows = el[pluginName]("sortRows", rows, colNum, ascending, col);
				el[pluginName]("replaceTableRows", rows);
				el[pluginName]("makeColDefault", col, ascending);
			}
		};

	// Collection method.
	$.fn[pluginName] = function (arrg) {
		var args = Array.prototype.slice.call(arguments, 1),
			returnVal;

		// if it's a method
		if (arrg && typeof (arrg) === "string") {
			returnVal = $.fn[pluginName].prototype[arrg].apply(this[0], args);
			return (typeof returnVal !== "undefined") ? returnVal : $(this);
		}
		// check init
		if (!$(this).data(pluginName + "data")) {
			$(this).data(pluginName + "active", true);
			$.fn[pluginName].prototype._create.call(this, arrg);
		}
		return $(this);
	};
	// add methods
	$.extend($.fn[pluginName].prototype, methods);

	$(document).on("tablesawcreate", function (e, Tablesaw) {
		if (Tablesaw.$table.is(initSelector)) {
			Tablesaw.$table[pluginName]();
		}
	});

} (jQuery));
