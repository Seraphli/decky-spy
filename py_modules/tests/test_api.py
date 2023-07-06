from deckyspy import DeckySpy


def test_get_memory():
    mem = DeckySpy.get_memory()
    print(mem)
    assert 0 < mem["total"]
    assert 0 < mem["available"]
    assert 0 < mem["percent"] < 100


def test_get_top_k_mem_procs():
    top = DeckySpy.get_top_k_mem_procs()
    print(top)
    assert len(top) > 0
    assert len(top[0]) == 2
    assert 0 < top[0][1]["mem"]["rss"]


def test_get_uptime():
    uptime = DeckySpy.get_uptime()
    print(uptime)
    assert uptime


def test_get_battery():
    battery = DeckySpy.get_battery()
    print(battery)
    if battery["battery"]:
        assert 0 <= battery["percent"] <= 100
