/* Inline project details: clicking a project card expands a panel beneath the
   row the card sits on (media on the left, text/buttons on the right). The
   content comes from the hidden .project_details template the card points at
   via data-project. */
$(function () {
    var SPEED = 350;
    var current = null; // { card, col, row, wrap }

    function navHeight() {
        return $('.tab-navigation').outerHeight() || 0;
    }

    // The last visible card column that shares a line with `col` in its row.
    function lastInVisualRow(col) {
        var top = col.offsetTop;
        var last = col;
        $(col).parent().children('.project_reveal:visible').each(function () {
            if (Math.abs(this.offsetTop - top) < 5) last = this;
        });
        return last;
    }

    function placeArrow(state) {
        var wrapLeft = state.wrap.offset().left;
        var cardCentre = state.card.offset().left + state.card.outerWidth() / 2;
        state.wrap.find('.project_panel_arrow').css('left', cardCentre - wrapLeft);
    }

    // Every video and screenshot in the write-up moves to the left column, in
    // the order they appear, leaving the right column as text and buttons.
    function pickMedia(body, card) {
        var media = $('<div class="project_panel_media"></div>');
        body.find('.embed-container, img').each(function () {
            var item = $(this);
            if (item.is('img') && item.closest('.embed-container').length) return;
            var parent = item.parent();
            var next = item.next();
            if (next.is('br')) next.remove();
            if (item.is('img')) item.removeAttr('width').addClass('project_panel_img');
            media.append(item);
            if (parent.is('p') && !parent.children().length && !$.trim(parent.text())) parent.remove();
        });
        // Drop line breaks that were only there to space out the media.
        body.children('br').each(function () {
            var prev = $(this).prev();
            if (!prev.length || prev.is('br')) $(this).remove();
        });
        if (media.children().length) {
            // A single item stays pinned while the text scrolls; a stack might
            // be taller than the screen, so it scrolls normally.
            return media.toggleClass('pinned', media.children().length === 1);
        }
        // No video or screenshot: fall back to the card's own preview art.
        var art = card.find('.project_container_img').first();
        var artClasses = (art.attr('class') || '').replace('project_container_img', '');
        return media.addClass('pinned').append($('<div class="project_panel_art"></div>').addClass(artClasses));
    }

    function buildPanel(card) {
        var template = $(card.data('project'));
        var title = template.find('.modal-title').first().text();
        var body = template.find('.modal-body').first().clone();
        var media = pickMedia(body, card);

        var wrap = $(
            '<div class="col-12 project_panel_wrap">' +
                '<span class="project_panel_arrow"></span>' +
                '<div class="project_panel" role="region">' +
                    '<button type="button" class="project_panel_close" aria-label="Close"><i class="fas fa-times"></i></button>' +
                    '<div class="row g-4">' +
                        '<div class="col-lg-6 project_panel_media_col"></div>' +
                        '<div class="col-lg-6 project_panel_text"><h2></h2></div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
        wrap.find('.project_panel').attr('aria-label', title);
        wrap.find('h2').text(title);
        wrap.find('.project_panel_media_col').append(media);
        wrap.find('.project_panel_text').append(body.children());
        initYoutubePlayers(wrap[0]);
        return wrap;
    }

    function close(state, animate, done) {
        if (!state) { if (done) done(); return; }
        state.card.removeClass('active').attr('aria-expanded', 'false');
        if (current === state) current = null;
        if (!animate) {
            state.wrap.remove();
            if (done) done();
            return;
        }
        state.wrap.addClass('animating').stop(true).animate({ height: 0, opacity: 0 }, SPEED, function () {
            state.wrap.remove();
            if (done) done();
        });
    }

    function scrollIntoViewIfNeeded(state, finalHeight) {
        var viewTop = $(window).scrollTop() + navHeight();
        var viewBottom = $(window).scrollTop() + window.innerHeight;
        var wrapTop = state.wrap.offset().top;
        var wrapBottom = wrapTop + finalHeight;
        if (wrapTop >= viewTop && wrapBottom <= viewBottom) return;
        // Show the whole card plus panel if they fit, otherwise keep just the
        // bottom of the card in view so the link between them is obvious.
        var cardTop = state.card.offset().top;
        var target = (wrapBottom - cardTop <= window.innerHeight - navHeight() - 40)
            ? cardTop - navHeight() - 20
            : wrapTop - navHeight() - 100;
        $('html, body').stop(true).animate({ scrollTop: Math.max(0, target) }, SPEED);
    }

    function open(card) {
        var col = card.closest('.project_reveal')[0];
        var state = { card: card, col: col, row: $(col).parent(), wrap: buildPanel(card) };

        state.wrap.insertAfter(lastInVisualRow(col));
        var finalHeight = state.wrap.outerHeight();
        placeArrow(state);

        card.addClass('active').attr('aria-expanded', 'true');
        current = state;

        state.wrap.addClass('animating').css({ height: 0, opacity: 0 })
            .animate({ height: finalHeight, opacity: 1 }, SPEED, function () {
                state.wrap.removeClass('animating').css({ height: '', opacity: '' });
            });
        scrollIntoViewIfNeeded(state, finalHeight);
        state.wrap.find('.project_panel_close')[0].focus({ preventScroll: true });
    }

    // Same visual row: swap the contents in place rather than collapsing.
    function swap(card) {
        var old = current;
        var col = card.closest('.project_reveal')[0];
        var fresh = buildPanel(card);
        var startHeight = old.wrap.outerHeight();

        old.card.removeClass('active').attr('aria-expanded', 'false');
        old.wrap.stop(true).find('.project_panel').replaceWith(fresh.find('.project_panel'));
        old.wrap.css('height', '');
        var finalHeight = old.wrap.outerHeight();

        var state = { card: card, col: col, row: old.row, wrap: old.wrap };
        current = state;
        card.addClass('active').attr('aria-expanded', 'true');
        placeArrow(state);

        state.wrap.find('.project_panel').css('opacity', 0).animate({ opacity: 1 }, SPEED);
        state.wrap.addClass('animating').css('height', startHeight)
            .animate({ height: finalHeight }, SPEED, function () {
                state.wrap.removeClass('animating').css('height', '');
            });
        state.wrap.find('.project_panel_close')[0].focus({ preventScroll: true });
    }

    $(document).on('click', '[data-project]', function (e) {
        e.preventDefault();
        var card = $(this);

        if (current && current.card[0] === this) {
            close(current, true);
            return;
        }

        if (!current) {
            open(card);
            return;
        }

        var col = card.closest('.project_reveal')[0];
        var sameLine = current.row[0] === col.parentNode &&
            lastInVisualRow(col) === lastInVisualRow(current.col);
        if (sameLine) {
            swap(card);
            return;
        }

        // A panel above the new card would shift it upwards as it collapses, so
        // remove it instantly and compensate the scroll position instead.
        var old = current;
        if (old.wrap.offset().top < card.offset().top) {
            var h = old.wrap.outerHeight(true);
            close(old, false);
            window.scrollBy(0, -h);
            open(card);
        } else {
            close(old, true);
            open(card);
        }
    });

    $(document).on('click', '.project_panel_close', function () {
        var state = current;
        if (!state) return;
        close(state, true, function () {
            state.card[0].focus({ preventScroll: true });
        });
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && current) {
            var state = current;
            close(state, true, function () { state.card[0].focus({ preventScroll: true }); });
        }
    });

    $('.tab-link').on('click', function () {
        close(current, false);
    });

    // Re-home the panel when the grid reflows to a different number of columns.
    var resizeTimer;
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!current) return;
            current.wrap.detach();
            current.wrap.insertAfter(lastInVisualRow(current.col));
            placeArrow(current);
        }, 150);
    });
});
