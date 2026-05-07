from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Database', '0008_item_user_recipe_user_alter_expense_id_alter_item_id_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSecret',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recovery_code_hash', models.CharField(max_length=128)),
                ('code_set_at', models.DateTimeField(auto_now=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='secret',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
