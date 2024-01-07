from deckyspy import DeckySpy


def test_get_memory():
    mem = DeckySpy.get_memory()
    print(mem)
    assert 0 < mem["vmem"]["total"]
    assert 0 < mem["vmem"]["available"]
    assert 0 < mem["vmem"]["percent"] < 100


def test_get_top_k_mem_procs():
    top = DeckySpy.get_top_k_mem_procs()
    print(top)
    assert len(top) > 0
    assert 0 < top[0]["mem"]["rss"]


def test_get_boottime():
    boottime = DeckySpy.get_boottime()
    print(boottime)
    assert boottime


def test_get_battery():
    battery = DeckySpy.get_battery()
    print(battery)
    if battery["battery"]:
        assert 0 <= battery["percent"] <= 100


def test_get_net_interface():
    interfaces = DeckySpy.get_net_interface()
    print(interfaces)
    for i in interfaces:
        if i["name"] == "lo":
            assert i["addresses"][0]["address"] == "127.0.0.1"
