<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sub_aspeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aspek_id')->constrained('aspeks')->onDelete('cascade');
            $table->string('nama_sub_aspek');
            $table->integer('kesalahan')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('sub_aspeks');
    }
};
