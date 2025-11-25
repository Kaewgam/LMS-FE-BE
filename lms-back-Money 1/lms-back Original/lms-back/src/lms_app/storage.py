import unicodedata
from django.core.files.storage import FileSystemStorage

class NormalizedStorage(FileSystemStorage):
    def get_available_name(self, name, max_length=None):
        name = unicodedata.normalize("NFC", name)
        return super().get_available_name(name, max_length)
