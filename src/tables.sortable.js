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
        sortableColSelector = "[data-" + pluginName + "-col]",
		sortableSwitchSelector = "[data-" + pluginName + "-switch]",
        optionsSelector = "[data-" + pluginName + "-options]",
        memoizeSelector = "[data-" + pluginName + "-memoize]",
		cookieName = pluginName + '-sortby',
		options = {
			default: "default",
			numeric: "numeric",
			forceAsc: "force-asc",
			forceDesc: "force-desc",
            noHint: "no-hint"
		},
		classes = {
            defaultCol: pluginName +  "-default-col",
            numericCol: pluginName + "-numeric-col",
			head: pluginName + "-head",
			ascend: pluginName + "-ascending",
			descend: pluginName + "-descending",
            ascendMark: pluginName + "-ascending-mark",
            descendMark: pluginName + "-descending-mark",
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
                            /*
							var b = $("<button class='" + classes.sortButton + "'/>");
							b.bind("click", { col: v }, fn);
							$(v).wrapInner(b);
                            */
                            $(v).bind("click", { col: v }, fn);
						});
					},
					clearOthers = function (sibs) {
						$.each(sibs, function (i, v) {
							var col = $(v);
							col.removeClass([
                                classes.defaultCol,
                                classes.ascend,
                                classes.ascendMark,
                                classes.descend,
                                classes.descendMark
                            ].join(' '));
						});
					},
					headsOnAction = function (e) { //callback function for th button
						e.preventDefault();
						e.stopPropagation();
						if ($(e.target).is('a[href]')) { return; }

						var //head = $(this).parent(),
							//v = e.data.col,
                            head = $(this),
							newSortValue = heads.index(head);

						if (head.hasClass(classes.descend)) {
							if (!el[pluginName]('hasOpt', head, options.forceDesc)) { newSortValue += '_asc'; }
							else { return; /* no-op */ }
						}
						else if (head.hasClass(classes.ascend)) {
							if (!el[pluginName]('hasOpt', head, options.forceAsc)) { newSortValue += '_desc'; }
							else { return; /* no-op */ }
						}
						else {
							if (el[pluginName]('hasOpt', head, options.forceAsc)) { newSortValue += '_asc'; }
							else { newSortValue += '_desc'; }
						}
						
						callSortWithSortval(newSortValue);						
					},
					processOptions = function (heads) {						
                        $.each(heads, function() {
                            var $t = $(this),
                                o = {},
                                isNumeric;
                            /* cache options */
                            $.each(options, function(k, v) {
                               o[k] = el[pluginName]('hasOpt', $t, v); 
                            });
                            
                            /* handle default */
                            if (o[options.default]) {
                                el[pluginName]('makeColDefault', $t, 
                                    !o[options.forceDesc] ? true : false,
                                    o[options.noHint]
                                );
                            }                            
                            
                            /* handle numeric */
                            if (o[options.numeric]) { 
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
                            }
                            if (isNumeric) { $t.addClass(classes.numericCol); }
                        });                        
					},
					addSwitcher = function (heads) {
						$switcher = $('<div>').addClass(classes.switcher).addClass(classes.tableToolbar).html(function () {
							var html = ['<label><span class="tablesaw-sort-label">' + Tablesaw.i18n.sort + '</span>:'];

							html.push('<span class="btn btn-small">&#160;<select>');
							heads.each(function (j) {
								var $t = $(this),
								    isDefaultCol = $t.hasClass(classes.defaultCol),
								    isDescending = $t.hasClass(classes.descend),
                                    isNumeric = $t.hasClass(classes.numericCol),
                                    isNoHint = el[pluginName]('hasOpt', $t, options.noHint);

								if (!el[pluginName]('hasOpt', $t, options.forceDesc)) { //add asc option if desc NOT forced
									html.push('<option' + (isDefaultCol && !isDescending ? ' selected' : '') + ' value="' + j + '_asc">' + $t.text());
                                    if (!isNoHint) {
                                        html.push(' ' + (isNumeric ? /*'&#x2191;'*/ '(0-9)' : '(A-Z)'));
                                    }
                                    html.push('</option>');
								}
								if (!el[pluginName]('hasOpt', $t, options.forceAsc)) { //add desc option if asc NOT forced
                                    html.push('<option' + (isDefaultCol && isDescending ? ' selected' : '') + ' value="' + j + '_desc">' + $t.text());
                                    if (!isNoHint) {
                                        html.push(' ' + (isNumeric ? /*'&#x2193;'*/ '(9-0)' : '(Z-A)'));
                                    }
                                    html.push('</option>');
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
						if (el.is(memoizeSelector)) {
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
						var defaultCol = $(heads).filter(classes.defaultCol);
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
				heads = el.find("thead th"+sortableColSelector);
				addClassToHeads(heads);
				makeHeadsActionable(heads, headsOnAction);
				processOptions(heads);
                if (el.is(sortableSwitchSelector)) {
                    addSwitcher(heads, el.find('tbody tr:nth-child(-n+3)'));
                }
                
				/* check if has previous sort setting */
				if (el.is(memoizeSelector)) {
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
            hasOpt: function(head, opt) {
                if (!head.is(optionsSelector)) { return false; }
                return (head.attr(optionsSelector.replace(/(\[|\])/g, '')).indexOf(opt) > 0) ? true : false;
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
				getSortFxn(ascending, $(col).hasClass(classes.numericCol));
				sorted = cells.sort(fn);
				rows = applyToRows(sorted, rows);
				return rows;
			},
			replaceTableRows: function (rows) {
				var el = $(this),
					body = el.find("tbody");
				body.html(rows);
			},
			makeColDefault: function (col, asc, nohint) {
				var c = $(col),
                    nh = nohint || $(this)[pluginName]('hasOpt', c, options.noHint);
				c.addClass(classes.defaultCol);
                if (asc) {
                    c.removeClass(classes.descend).addClass(classes.ascend);
                    if (!nh) { c.removeClass(classes.descendMark).addClass(classes.ascendMark); }
                } else {
                    c.removeClass(classes.ascend).addClass(classes.descend);
                    if (!nh) { c.removeClass(classes.ascendMark).addClass(classes.descendMark); }
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
