from windmill.authoring import WindmillTestClient
from hashlib import md5
from time import time

def test_fold():
    client = WindmillTestClient(__name__)

    client.waits.forElement(classname='jpoker_table')
    client.click(classname=u'jpoker_login_name')
    client.type(classname='jpoker_login_name', text=u'user%s' % md5(str(time())).hexdigest())
    client.click(classname=u'jpoker_login_password')
    client.type(classname=u'jpoker_login_password', text=u'password')
    client.click(classname=u'jpoker_login_submit')
    client.waits.forElement(classname='jpoker_logout')
    client.click(classname=u'jpoker_tablepicker_submit')
    for i in range(100):
        client.waits.forElement(jquery=u'(".jpoker_ptable_fold:visible")[0]', timeout=u'60000')
        client.click(classname=u'jpoker_ptable_fold')
        client.waits.forElement(jquery=u'(".jpoker_ptable_fold:hidden")[0]', timeout=u'60000')
