# -*- coding: utf-8 -*-
#
# This file is part of CDS.
# Copyright (C) 2016 CERN.
#
# CDS is free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation; either version 2 of the
# License, or (at your option) any later version.
#
# CDS is distributed in the hope that it will be
# useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with CDS; if not, write to the
# Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston,
# MA 02111-1307, USA.
#
# In applying this license, CERN does not
# waive the privileges and immunities granted to it by virtue of its status
# as an Intergovernmental Organization or submit itself to any jurisdiction.

"""CDS tests for Webhook receivers."""

from __future__ import absolute_import, print_function

import uuid
from celery import shared_task, states
from cds.modules.deposit.minters import catid_minter
from invenio_indexer.api import RecordIndexer

from cds.modules.webhooks.tasks import _factory_avc_task_base
from cds.modules.deposit.api import Category


@shared_task(bind=True)
def failing_task(self, *args, **kwargs):
    """A failing shared task."""
    self.update_state(state=states.FAILURE, meta={})


@shared_task(bind=True)
def success_task(self, *args, **kwargs):
    """A failing shared task."""
    self.update_state(state=states.SUCCESS, meta={})


@shared_task(bind=True, base=_factory_avc_task_base(type_='simple_failure'))
def sse_failing_task(self, *args, **kwargs):
    """A failing shared task."""
    self.update_state(
        state=states.FAILURE, meta={'exc_type': 'fuu', 'exc_message': 'fuu'})


@shared_task(bind=True, base=_factory_avc_task_base(type_='simple_failure'))
def sse_success_task(self, *args, **kwargs):
    """A failing shared task."""
    self.update_state(state=states.SUCCESS, meta={})


@shared_task
def simple_add(x, y):
    """Simple shared task."""
    return x + y


@shared_task(bind=True, base=_factory_avc_task_base(type_='simple_add'))
def sse_simple_add(self, x, y, **kwargs):
    """Simple shared task."""
    self._base_payload = {"deposit_id": kwargs.get('deposit_id')}
    return x + y


def create_category(api_app, db, data):
    """Create a fixture for category."""
    with db.session.begin_nested():
        record_id = uuid.uuid4()
        catid_minter(record_id, data)
        category = Category.create(data)

    db.session.commit()

    indexer = RecordIndexer()
    indexer.index_by_id(category.id)

    return category


def mock_current_user(*args2, **kwargs2):
    """Mock current user not logged-in."""
    return None
