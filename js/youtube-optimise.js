/* Light YouTube Embeds by @labnol */
/* Web: http://labnol.org/?p=27941 */

/* Players inside hidden project templates are skipped here and set up by
   project-panel.js when their panel is opened, so their thumbnails are only
   downloaded on demand. */
function initYoutubePlayers(root) {
    var v = (root || document).getElementsByClassName("youtube-player");
    for (var n = 0; n < v.length; n++) {
        if (!root && v[n].closest(".project_details")) continue;
        var div = document.createElement("div");
        div.setAttribute("data-id", v[n].dataset.id);
        div.innerHTML = labnolThumb(v[n].dataset.id);
        div.onclick = labnolIframe;
        v[n].innerHTML = "";
        v[n].appendChild(div);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    initYoutubePlayers();
});

function labnolThumb(id) {
    var thumb = '<img src="https://i.ytimg.com/vi/ID/hqdefault.jpg">',
        play = '<i class="fas fa-play lazyload_play"></i>';
    return thumb.replace("ID", id) + play;
}

function labnolIframe() {
    var iframe = document.createElement("iframe");
    var embed = "https://www.youtube.com/embed/ID?autoplay=1";
    iframe.setAttribute("src", embed.replace("ID", this.dataset.id));
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "1");
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    this.parentNode.replaceChild(iframe, this);
}
