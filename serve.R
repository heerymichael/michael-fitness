# serve.R ---------------------------------------------------------------
# Preview Michael Fitness locally, including on your phone over wifi.
#
# In RStudio: open this file and click Source (or Ctrl/Cmd + Shift + S).
# Stop it with the red stop button in the Console.
#
# Service workers and "Add to Home Screen" need either https or localhost,
# so on the phone you will get the app but not the installable PWA. That
# only works properly once it is on GitHub Pages. For checking layout,
# timers and logging on the phone, this is enough.
# -----------------------------------------------------------------------

if (!requireNamespace("servr", quietly = TRUE)) {
  stop("Run install.packages('servr') first, then Source this file again.")
}

port <- 4321

# Find the machine's LAN address so you can type it into your phone.
lan_ip <- function() {
  out <- tryCatch({
    if (.Platform$OS.type == "windows") {
      ip <- system("ipconfig", intern = TRUE)
      ip <- grep("IPv4", ip, value = TRUE)
      trimws(sub(".*:\\s*", "", ip))
    } else {
      ip <- suppressWarnings(system("ipconfig getifaddr en0", intern = TRUE))
      if (!length(ip) || !nzchar(ip[1])) {
        ip <- suppressWarnings(system("hostname -I", intern = TRUE))
        ip <- strsplit(trimws(ip), "\\s+")[[1]]
      }
      ip
    }
  }, error = function(e) character(0))
  out <- out[nzchar(out) & !startsWith(out, "127.")]
  if (length(out)) out[1] else NA_character_
}

ip <- lan_ip()

message("\n  Michael Fitness is running.\n")
message("  On this machine:  http://localhost:", port)
if (!is.na(ip)) {
  message("  On your phone:    http://", ip, ":", port,
          "   (same wifi network)")
} else {
  message("  Could not work out your LAN address. Find it in your ",
          "network settings and use http://<that address>:", port)
}
message("\n  Press the red stop button in the Console to stop.\n")

servr::httd(dir = ".", port = port, host = "0.0.0.0", browse = TRUE)
