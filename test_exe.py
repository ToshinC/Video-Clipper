import urllib.request, json, time

def get(path):
    return urllib.request.urlopen("http://127.0.0.1:8000" + path)

def post(path, data):
    req = urllib.request.Request("http://127.0.0.1:8000" + path,
                                 data=json.dumps(data).encode(),
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req)

print("Health:", get("/health").read().decode())

r = post("/clips", {"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                    "target_count": 10, "min_len": 1, "max_len": 6})
job = json.loads(r.read().decode())
jid = job["job_id"]
print("Job created:", job)

status = None
for i in range(40):
    time.sleep(2)
    st = json.loads(get("/clips/" + jid).read().decode())
    status = st["status"]
    print("poll %d: %s" % (i, status))
    if status in ("done", "failed"):
        break

if status == "done":
    clips = json.loads(get("/clips/" + jid + "/clips").read().decode())
    print("Clips: %d" % len(clips["clips"]))
    for c in clips["clips"]:
        print("  Clip %d: %.1fs-%.1fs score=%d tier=%s platform=%s" % (
            c["index"], c["start"], c["end"], c["score"], c["tier"],
            c["recommended_platform"]))
else:
    print("Final status:", status)
