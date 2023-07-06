import json

import click
from deckyspy import DeckySpy


@click.group()
def cli():
    pass


@cli.command()
def get_memory():
    out = json.dumps(DeckySpy.get_memory())
    print(out)


@cli.command()
@click.option("--k", default=10, help="Number of results.")
def get_top_k_mem_procs(k):
    out = json.dumps(DeckySpy.get_top_k_mem_procs(k))
    print(out)


@cli.command()
def get_uptime():
    out = json.dumps(DeckySpy.get_uptime())
    print(out)


@cli.command()
def get_battery():
    out = json.dumps(DeckySpy.get_battery())
    print(out)


if __name__ == "__main__":
    cli()