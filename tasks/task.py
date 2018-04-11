import tasks

class _Task:    
    column_width = {'title': 48}
    
    def __init__(self, session, d):
        self.session = session
        self.d = d
    
    def __getitem__(self, key):
        return self.d[key]
    
    def __setitem__(self, key, value):
        self.d[key] = value
    
    def get(self, key, default):
        return self.d.get(key, default)

    def __lt__(self, other):
        if other['due_last'] is None: return True
        if self.d['due_last'] is None: return False
        return self.d['due_last'] < other['due_last']

    def posts(self):
        for post in self.d.get("posts", []):
            yield tasks.SafePost(self.session, post)
    
    def due_str(self):
        due = self.d['due_last']
        #due_str = '{:26s}'.format(datetimeToString(due))
        
        if due:
            due = pytz.utc.localize(due)
            due_str = '{:26s}'.format(datetimeToString(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = '{:26s}'.format('')
        
        return due_str

    def status_str(self):
        s = Status(self.d.get('status_last',0))
        return '{:11s}'.format(s.name)


